'use client'

import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Heart, Camera, Users, Briefcase, Coffee, Sparkles, Mail, ExternalLink } from 'lucide-react'
import Link from 'next/link'

type ContactType = {
  name: string
  description: string
  mail?: string
  link?: string
  photo?: string
}

// Données des contributeurs
const teamMembers: ContactType[] = [
  {
    name: 'Eva GARCIA',
    description: 'Maquettes & Design UI/UX',
    mail: 'eva78990@gmail.com',
    link: 'https://www.eva-garcia.work/',
    photo: '/images/credits/eva-garcia-photo.jpeg',
  },
  {
    name: 'Lucie BOISNEAULT',
    description: 'Graphisme & Identité Visuelle',
    link: 'https://www.linkedin.com/in/lucie-boisneault-945a631b3/',
    photo: '/images/credits/lucie-boisneault-photo.jpeg',
  },
  {
    name: 'Thomas ROMARY',
    description: 'Marketing & Stratégie de contenu',
    link: "https://www.linkedin.com/in/thomas-romary/",
    photo: '/images/credits/thomas-romary-photo.jpeg',
  }
]

const investors: ContactType[] = []

const partners: ContactType[] = [
  {
    name: 'Mathieu PERRIN',
    description: 'Ostéopathe certifié - Spécialiste du sport',
    link: 'https://www.doctolib.fr/osteopathe/neauphle-le-chateau/mathieu-perrin/booking/motives?specialityId=10&telehealth=false&placeId=practice-98553&profile_skipped=true&bookingFunnelSource=external_referral',
    photo: '/images/images/osteopath-practicing-pt2.avif',
  }
]

const photographers: ContactType[] = [
  {
    name: 'Lucas LEBRUN',
    description: 'Photographe sportif et d\'aventure',
    mail: 'lebrun.lucas.16@gmail.com',
    link: 'https://www.instagram.com/lucaddictif/',
    photo: '/images/credits/lucas-lebrun-photo.jpg',
  },
  {
    name: 'Amaëlle DEPLACE',
    description: 'Photographe de paysage et d\'émotions',
    link: 'https://www.instagram.com/amaelle_dplc/',
    photo: '/images/credits/amaelle-deplace-photo.jpg',
  },
  {
    name: 'Tanguy CANTON',
    description: 'Photographe et vidéaste sportif',
    link: 'https://www.tanguycanton.fr/',
    mail: 'tanguy.canton13@gmail.com',
    photo: '/images/credits/tanguy-canton-photo.jpg',
  },
  {
    name: 'Noa FOULON',
    description: 'Cadreur et caméraman',
    link: 'https://www.instagram.com/foulon.noa/',
    photo: '/images/credits/noa-foulon-photo.jpg',
  },
]

// Composant de carte pour afficher un contact
function ContactCard({ contact, colorScheme }: { contact: ContactType; colorScheme: string }) {
  return (
    <Card className={`h-full flex flex-col w-full p-0 m-0 border-2 ${colorScheme} hover:-translate-y-1 transition-all group overflow-hidden`}>
      {contact.photo && (
        <div className="relative top-0 w-full h-80 overflow-hidden">
          <Image
            src={contact.photo}
            alt={contact.name}
            fill
            className="object-cover object-center group-hover:scale-105 transition-transform duration-300 rounded-t-lg rounded-tr-lg"
          />
        </div>
      )}
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{contact.name}</CardTitle>
          {contact.link && (
            <Link href={contact.link} target="_blank" rel="noopener noreferrer" className='cursor-pointer group'>
              <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pb-6">
        <p className="text-sm text-muted-foreground">
          {contact.description}
        </p>
        {contact.mail && (
          <a
            href={`mailto:${contact.mail}`}
            className="flex items-center gap-2 text-xs text-primary hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            <Mail className="h-3 w-3" />
            {contact.mail}
          </a>
        )}
      </CardContent>
    </Card>
  )
}

export default function CreditsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-muted/10 to-background text-foreground">
      {/* Hero Section */}
      <section className='relative isolate overflow-hidden py-20 sm:py-24'>
        <div className='absolute inset-0'>
          <Image
            src={"/images/images/overbound-headband-on-chains-with-grass-in-background.avif"}
            alt='Crédits Overbound'
            fill
            sizes='100vw'
            className='object-cover object-center'
            priority
          />
          <div className='pointer-events-none absolute inset-0 bg-background/5 backdrop-blur-[3px]' />
          <div className='pointer-events-none absolute inset-0 bg-gradient-to-b from-background/15 via-background/70 to-background' />
          <div className='pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-background via-background/80 to-transparent' />
        </div>
        <div className='py-50 relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 sm:px-6 lg:px-8'>
          <div className='max-w-3xl space-y-6 text-center lg:text-left'>
            <span className='inline-flex items-center justify-center rounded-full bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-primary sm:text-sm'>
              Crédits
            </span>
            <h1 className='text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl'>
              Merci à tous ceux qui rendent Overbound possible
            </h1>
            <p className='text-base leading-relaxed text-muted-foreground sm:text-lg'>
              Overbound n&apos;existerait pas sans le soutien, l&apos;aide et la confiance de nombreuses personnes.
              Cette page leur est dédiée.
            </p>
          </div>
        </div>
        <div className='pointer-events-none absolute inset-x-0 bottom-[-10%] flex justify-center opacity-70'>
          <Image
            src='/images/decorations/mountain-vector.svg'
            alt='Décor montagne'
            width={1600}
            height={800}
            className='w-[220%] max-w-none sm:w-[170%] md:w-[140%]'
            priority
          />
        </div>
      </section>

      {/* Fondateur */}
      <section className="relative z-10 py-16 sm:py-20">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-12">
            <Badge className="bg-primary/20 text-primary border-primary/40">
              <Sparkles className="h-4 w-4 mr-2" />
              Fondateur
            </Badge>
            <h2 className="text-3xl font-bold sm:text-4xl">
              L&apos;origine du projet
            </h2>
          </div>

          <div className="max-w-2xl mx-auto">
            <Card className="h-full flex flex-col w-full p-0 m-0 border-2 border-primary/20 bg-gradient-to-br from-background to-primary/5 hover:-translate-y-1 transition-all group overflow-hidden">
              <div className="relative top-0 w-full h-100 overflow-hidden">
                <Image
                  src={"/images/credits/florian-palvadeau-photo.avif"}
                  alt="Florian PALVADEAU, Fondateur d'Overbound"
                  fill
                  sizes='100vw'
                  className='object-cover rounded-t-lg rounded-tr-lg group-hover:scale-105 transition-transform duration-300'
                  style={{ objectPosition: '50% 30%' }}
                  priority
                />
              </div>
              <CardHeader>
                <CardTitle className="text-2xl">Florian Palvadeau</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pb-8">
                <p className="text-muted-foreground leading-relaxed">
                  Fondateur et créateur d&apos;Overbound. Passionné d&apos;OCR et d&apos;innovation, j&apos;ai créé cette organisation
                  avec l&apos;ambition de révolutionner l&apos;obstacle course racing en Europe.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Équipe & Contributeurs */}
      {teamMembers.length > 0 && (
        <section className="relative z-10 py-16 sm:py-20 bg-muted/30">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center space-y-4 mb-12">
              <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/40">
                <Users className="h-4 w-4 mr-2" />
                Équipe & Contributeurs
              </Badge>
              <h2 className="text-3xl font-bold sm:text-4xl">
                Ceux qui font avancer le projet
              </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {teamMembers.map((member, index) => (
                <ContactCard
                  key={index}
                  contact={member}
                  colorScheme="border-amber-500/20 bg-gradient-to-br from-background to-amber-500/5"
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Investisseurs */}
      {investors.length > 0 && (
        <section className="relative z-10 py-16 sm:py-20">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center space-y-4 mb-12">
              <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/40">
                <Briefcase className="h-4 w-4 mr-2" />
                Investisseurs
              </Badge>
              <h2 className="text-3xl font-bold sm:text-4xl">
                Ceux qui croient en notre vision
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Merci à ceux qui nous font confiance et nous permettent de concrétiser nos ambitions.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {investors.map((investor, index) => (
                <ContactCard
                  key={index}
                  contact={investor}
                  colorScheme="border-emerald-500/20 bg-gradient-to-br from-background to-emerald-500/5"
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Partenaires */}
      {partners.length > 0 && (
        <section className="relative z-10 py-16 sm:py-20 bg-muted/30">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center space-y-4 mb-12">
              <Badge className="bg-purple-500/20 text-purple-600 border-purple-500/40">
                <Coffee className="h-4 w-4 mr-2" />
                Partenaires
              </Badge>
              <h2 className="text-3xl font-bold sm:text-4xl">
                Nos alliés
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Les marques, personnes et organisations qui nous accompagnent dans cette aventure.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {partners.map((partner, index) => (
                <ContactCard
                  key={index}
                  contact={partner}
                  colorScheme="border-purple-500/20 bg-gradient-to-br from-background to-purple-500/5"
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Photographes & Créateurs */}
      {photographers.length > 0 && (
        <section className="relative z-10 py-16 sm:py-20">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center space-y-4 mb-12">
              <Badge className="bg-pink-500/20 text-pink-600 border-pink-500/40">
                <Camera className="h-4 w-4 mr-2" />
                Photographes & Créateurs
              </Badge>
              <h2 className="text-3xl font-bold sm:text-4xl">
                Ceux qui capturent nos moments
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Les artistes qui immortalisent l&apos;esprit Overbound à travers leurs objectifs.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {photographers.map((photographer, index) => (
                <ContactCard
                  key={index}
                  contact={photographer}
                  colorScheme="border-pink-500/20 bg-gradient-to-br from-background to-pink-500/5"
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Remerciements spéciaux */}
      <section className="relative bg-accent-foreground py-16 sm:py-20">
        <Image
          src='/images/decorations/mountain-vector.svg'
          alt='Illustration montagne'
          width={1200}
          height={600}
          className='z-1 pointer-events-none absolute -top-10 lg:top-[-1%] rotate-180 left-1/2 w-screen max-w-none -translate-x-1/2'
        />
        <Image
          src="/images/decorations/wall-texture.png"
          alt="Wall texture decoration"
          width={600}
          height={400}
          className="w-full h-full absolute top-0 left-0 object-cover opacity-80"
        />
        <div className="py-50 container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center space-y-6 max-w-3xl mx-auto">
            <Badge className="bg-background/80 text-foreground border-border">
              <Heart className="h-4 w-4 mr-2" />
              Remerciements
            </Badge>
            <h2 className="text-3xl font-bold sm:text-4xl text-background">
              Merci à tous
            </h2>
            <p className="text-background/90 leading-relaxed text-lg">
              Un grand merci à tous ceux qui, de près ou de loin, ont contribué à faire d&apos;Overbound ce qu&apos;il est aujourd&apos;hui.
              Chaque conseil, chaque coup de main, chaque encouragement compte et nous permet d&apos;avancer vers notre vision.
            </p>
            <p className="text-background/90 leading-relaxed text-lg font-semibold">
              Cette aventure ne fait que commencer, et c&apos;est grâce à vous tous.
            </p>
          </div>
        </div>
        <Image
          src='/images/decorations/mountain-vector.svg'
          alt='Illustration montagne'
          width={1200}
          height={600}
          className='z-1 pointer-events-none absolute bottom-[-1%] left-1/2 w-screen max-w-none -translate-x-1/2'
        />
      </section>
    </main>
  )
}
