import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { Download } from 'lucide-react'
import { PageHero } from '@/components/hero/PageHero'
import { SectionEyebrow } from '@/components/events/landing/SectionEyebrow'
import { Button } from '@/components/ui/button'
import { PARTNERS_DATA } from '@/datas/Partners'

export const metadata: Metadata = {
  title: 'Partenaires & presse | Overbound Race',
  description:
    'Les partenaires d’Overbound, le dossier de sponsoring 2026 et les contacts partenariats et presse.',
  alternates: { canonical: 'https://overbound-race.com/about/partners' },
  openGraph: {
    title: 'Partenaires & presse | Overbound Race',
    description: 'Les partenaires d’Overbound, le dossier de sponsoring 2026 et nos contacts.',
    url: 'https://overbound-race.com/about/partners',
    siteName: 'Overbound Race',
    images: ['/images/images/overbound-og-cover.jpg'],
    locale: 'fr_FR',
    type: 'website',
  },
}

const SPONSORING_PDF_URL = '/images/brand/Overbound – Dossier Sponsoring 2026.pdf'

const BENEFITS = [
  {
    title: 'Visibilité',
    text: 'Votre logo sur le site, les réseaux sociaux et la signalétique de l’événement, un stand sur le village et des mentions dans nos communications.',
  },
  {
    title: 'Une communauté engagée',
    text: 'Un public sportif, actif sur les réseaux, sensible aux marques qui s’engagent à ses côtés.',
  },
  {
    title: 'Des valeurs partagées',
    text: 'Dépassement de soi, bienveillance, esprit d’équipe et respect de la nature.',
  },
  {
    title: 'Des activations sur mesure',
    text: 'Sampling, animations, challenges, contenus co-brandés : on construit selon vos objectifs.',
  },
]

const CONTACTS = [
  {
    label: 'Partenariats et sponsoring',
    email: 'partners@overbound-race.com',
    note: 'Collaborations, sponsoring, opportunités commerciales.',
  },
  {
    label: 'Presse',
    email: 'press@overbound-race.com',
    note: 'Interviews, demandes de visuels, couverture de l’événement.',
  },
]

export default function PartnersPage() {
  return (
    <main className="w-full bg-background text-foreground">
      <PageHero
        image={{
          src: '/images/images/a-photograph-in-action.avif',
          alt: 'Photographe en action lors d’un événement Overbound',
        }}
        eyebrow="Partenaires & presse"
        title="Travaillons ensemble"
        description="Ils nous font confiance. Vous pouvez nous rejoindre."
        actions={
          <>
            <Button asChild size="lg" className="min-h-11 w-full sm:w-auto">
              <a href={SPONSORING_PDF_URL} download>
                <Download className="mr-2 size-4" />
                Dossier sponsoring 2026
              </a>
            </Button>
            <Button asChild size="lg" variant="outline" className="min-h-11 w-full sm:w-auto">
              <a href="#contacts">Nous contacter</a>
            </Button>
          </>
        }
      />

      <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <SectionEyebrow>Nos partenaires</SectionEyebrow>
        <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {PARTNERS_DATA.map((partner) => {
            const logo = (
              <span className="relative block h-16 w-full">
                <Image
                  src={partner.logo}
                  alt={partner.name}
                  fill
                  sizes="(min-width: 1024px) 15vw, (min-width: 640px) 28vw, 44vw"
                  className="object-contain"
                />
              </span>
            )
            return (
              <li key={partner.name} className="flex items-center justify-center rounded-lg bg-white p-6">
                {partner.url ? (
                  <a
                    href={partner.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={partner.name}
                    className="block w-full"
                  >
                    {logo}
                  </a>
                ) : (
                  logo
                )}
              </li>
            )
          })}
        </ul>
      </section>

      <section className="border-y bg-muted/30">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <SectionEyebrow>Pourquoi s’associer</SectionEyebrow>
          <dl className="mt-8 grid gap-8 sm:grid-cols-2">
            {BENEFITS.map((benefit) => (
              <div key={benefit.title} className="space-y-2">
                <dt className="text-xl font-black">{benefit.title}</dt>
                <dd className="text-foreground/80">{benefit.text}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-10">
            <a
              href={SPONSORING_PDF_URL}
              download
              className="inline-flex min-h-11 items-center font-semibold text-primary underline-offset-4 hover:underline"
            >
              Tout le détail dans le dossier de sponsoring (PDF) →
            </a>
          </p>
        </div>
      </section>

      <section id="contacts" className="mx-auto w-full max-w-6xl scroll-mt-24 px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <SectionEyebrow>Contacts</SectionEyebrow>
        <ul className="mt-8 grid gap-8 sm:grid-cols-2">
          {CONTACTS.map((contact) => (
            <li key={contact.email} className="space-y-1">
              <p className="text-xl font-black">{contact.label}</p>
              <p className="text-foreground/80">{contact.note}</p>
              <a
                href={`mailto:${contact.email}`}
                className="inline-flex min-h-11 items-center break-words font-semibold text-primary underline-offset-4 hover:underline"
              >
                {contact.email}
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-10 text-sm text-muted-foreground">
          Une autre question ? <Link href="/contact" className="inline-flex min-h-11 items-center font-semibold text-primary hover:underline">Page contact</Link>
        </p>
      </section>
    </main>
  )
}
