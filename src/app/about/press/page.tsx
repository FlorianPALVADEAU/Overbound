'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Mail,
  Image as ImageIcon,
  FileText,
  Megaphone,
  Handshake,
  Quote,
  Users,
  Trophy,
  MapPin,
  ExternalLink,
  Download,
} from 'lucide-react'

const SPONSORING_PDF_URL = '/images/brand/Overbound – Dossier Sponsoring 2026.pdf'

const KEY_FIGURES = [
  { value: '2026', label: 'Lancement officiel' },
  { value: '200+', label: 'Participants attendus' },
  { value: '2', label: 'Formats de course' },
  { value: '10+', label: 'Obstacles uniques' },
]

const PRESS_RESOURCES = [
  {
    title: 'Kit Média',
    description: 'Logos vectoriels, visuels haute résolution et charte graphique pour vos publications.',
    icon: ImageIcon,
    items: ['Logos (PNG, SVG, PDF)', 'Photos événements HD', 'Visuels réseaux sociaux'],
    available: false,
  },
  {
    title: 'Dossier de Presse',
    description: "Présentation complète d'Overbound : concept, équipe, vision et chiffres clés.",
    icon: FileText,
    items: ['Historique du projet', 'Chiffres clés', 'Formats OPEN & RANKED'],
    available: false,
  },
  {
    title: 'Communiqués',
    description: 'Annonces officielles, résultats et nouveautés autour des événements Overbound.',
    icon: Megaphone,
    items: ['Annonces événements', 'Résultats & classements', 'Nouveaux partenariats'],
    available: false,
  },
]

const PRESS_CONTACTS = [
  {
    name: 'Relations Presse',
    email: 'presse@overbound-race.com',
    description: 'Demandes médias, interviews et couverture événementielle',
    icon: Mail,
  },
  {
    name: 'Partenariats & Sponsoring',
    email: 'partenariats@overbound-race.com',
    description: 'Collaborations, sponsoring et opportunités commerciales',
    icon: Handshake,
    hasSponsoringPdf: true,
  },
]

export default function PressPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-muted/10 to-background text-foreground">
      {/* Hero */}
      <section className="relative isolate overflow-hidden py-40 sm:py-44">
        <div className="absolute inset-0">
          <Image
            src="/images/images/a-photograph-in-action.avif"
            alt="Photographe en action lors d'un événement Overbound"
            fill
            sizes="100vw"
            className="object-cover object-center"
            priority
          />
          <div className="pointer-events-none absolute inset-0 bg-background/30 backdrop-blur-[2px]" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/10 via-background/60 to-background" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-background via-background/90 to-transparent" />
        </div>
        <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-6 text-center lg:text-left animate-fade-in-up animate-duration-700">
            <span className="inline-flex items-center justify-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-primary shadow-sm shadow-primary/10 sm:text-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              Espace Presse
            </span>
            <h1 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
              Médias & Ressources
            </h1>
            <p className="text-base leading-relaxed text-muted-foreground sm:text-lg md:text-xl">
              Tout ce dont vous avez besoin pour couvrir Overbound : visuels, contacts, chiffres clés et communiqués.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button asChild size="lg" className="h-12 shadow-lg shadow-primary/25">
                <a href={SPONSORING_PDF_URL} download>
                  <Download className="mr-2 h-5 w-5" />
                  Dossier Sponsoring 2026
                </a>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-12 border-primary text-primary hover:bg-primary/10">
                <Link href="mailto:presse@overbound-race.com">
                  <Mail className="mr-2 h-4 w-4" />
                  Contacter la presse
                </Link>
              </Button>
            </div>
          </div>
        </div>
        <div className='pointer-events-none absolute inset-x-0 bottom-[-10%] flex justify-center opacity-70'>
          <Image
            src='/images/decorations/mountain-vector.svg'
            alt='Décor montagne'
            width={1600}
            height={800}
            className='w-[220%] max-w-none sm:w-[170%] md:w-[140%]'
          />
        </div>
      </section>

      {/* Chiffres clés */}
      {/* <section className="relative overflow-hidden py-16 sm:py-20">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
        <div className="container relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 space-y-2 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
              En un coup d&apos;œil
            </p>
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">Overbound en chiffres</h2>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {KEY_FIGURES.map((fig) => (
              <div
                key={fig.label}
                className="group rounded-2xl border border-border/60 bg-card/80 p-6 text-center transition hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5"
              >
                <p className="text-3xl font-extrabold text-primary sm:text-4xl">{fig.value}</p>
                <p className="mt-2 text-sm text-muted-foreground">{fig.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* Bannière Dossier Sponsoring */}
      <section className="py-4">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-2xl border-2 border-primary/30 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 p-8 sm:p-10">
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
            <div className="pointer-events-none absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
            <div className="relative flex flex-col gap-6 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
              <div className="space-y-2">
                <Badge className="mb-2 border-0 bg-primary/15 text-primary">PDF — 2026</Badge>
                <h3 className="text-xl font-bold text-foreground sm:text-2xl">Dossier Sponsoring Overbound 2026</h3>
                <p className="text-sm text-muted-foreground sm:text-base">
                  Découvrez nos offres de partenariat, notre audience, nos valeurs et les opportunités de visibilité pour votre marque.
                </p>
              </div>
              <Button asChild size="lg" className="h-14 shrink-0 rounded-2xl bg-primary px-8 text-lg font-bold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90">
                <a href={SPONSORING_PDF_URL} download>
                  <Download className="mr-2 h-5 w-5" />
                  Télécharger le PDF
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* À propos — résumé éditorial */}
      <section className="bg-background py-16 sm:py-20">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
              Qui sommes-nous
            </p>
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">Overbound en quelques mots</h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="group rounded-2xl border border-border/60 bg-card/80 p-6 transition hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5">
              <div className="mb-3 flex items-center gap-3">
                <div className="rounded-xl bg-primary/10 p-2.5">
                  <Quote className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Le concept</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Overbound</strong> est une course à obstacles nouvelle génération
                organisée sous forme de backyard, sur une boucle unique en pleine nature. Deux formats — OPEN et RANKED —
                permettent à chacun de choisir son niveau d&apos;engagement, du sportif curieux à l&apos;athlète confirmé.
              </p>
            </div>
            <div className="group rounded-2xl border border-border/60 bg-card/80 p-6 transition hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5">
              <div className="mb-3 flex items-center gap-3">
                <div className="rounded-xl bg-primary/10 p-2.5">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">La communauté</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Plus qu&apos;une course, Overbound c&apos;est une tribu. Chaque événement est pensé pour créer des souvenirs
                et pousser chacun à se dépasser dans une ambiance bienveillante. Village, partenaires, musique et public :
                tout est fait pour vivre une journée complète.
              </p>
            </div>
            <div className="group rounded-2xl border border-border/60 bg-card/80 p-6 transition hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5">
              <div className="mb-3 flex items-center gap-3">
                <div className="rounded-xl bg-primary/10 p-2.5">
                  <Trophy className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Ce qui nous différencie</h3>
              </div>
              <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />Obstacles propriétaires conçus et fabriqués par nos équipes</li>
                <li className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />Format backyard unique en France pour l&apos;OCR</li>
                <li className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />Approche inclusive et bienveillante de la performance</li>
              </ul>
            </div>
            <div className="group rounded-2xl border border-border/60 bg-card/80 p-6 transition hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5">
              <div className="mb-3 flex items-center gap-3">
                <div className="rounded-xl bg-primary/10 p-2.5">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Premier événement</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Ultra Arena 2026</strong> — Base de loisirs de Saint-Quentin-en-Yvelines
                (Yvelines, Île-de-France). Notre première édition rassemblera 200+ participants sur une boucle de 2 km
                jalonnée de plus de 10 obstacles.
              </p>
              <Button asChild variant="link" className="mt-2 h-auto p-0 text-primary">
                <Link href="/events/ultra-arena-2026">
                  Voir l&apos;événement <ExternalLink className="ml-1 h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Ressources Média */}
      <section className="relative overflow-hidden py-16 sm:py-20">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
        <div className="pointer-events-none absolute -right-32 top-10 h-72 w-72 rounded-full bg-primary/8 blur-3xl" />
        <div className="container relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
              Téléchargements
            </p>
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">Ressources Média</h2>
            <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
              Logos, visuels et documents officiels pour accompagner votre couverture.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {PRESS_RESOURCES.map((resource) => {
              const Icon = resource.icon
              return (
                <div
                  key={resource.title}
                  className="group relative flex flex-col rounded-2xl border border-border/60 bg-card/80 p-6 transition hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5"
                >
                  <div className="mb-4 flex items-center gap-3">
                    <div className="rounded-xl bg-primary/10 p-2.5">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">{resource.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{resource.description}</p>
                  <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                    {resource.items.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 pt-4 border-t border-border/40">
                    {resource.available ? (
                      <Button variant="outline" size="sm" className="w-full border-primary/30 text-foreground">
                        Télécharger
                      </Button>
                    ) : (
                      <Badge variant="secondary" className="w-full justify-center py-1.5 bg-muted/60 text-muted-foreground">
                        Disponible prochainement
                      </Badge>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Contacts Presse */}
      <section className="bg-background py-16 sm:py-20">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 space-y-2 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
              Nous contacter
            </p>
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">Contacts Presse</h2>
            <p className="mx-auto max-w-2xl text-sm text-muted-foreground sm:text-base">
              Notre équipe est à votre disposition pour toute demande média ou partenariat.
            </p>
          </div>

          <div className="mx-auto grid max-w-3xl gap-6 md:grid-cols-2">
            {PRESS_CONTACTS.map((contact) => {
              const Icon = contact.icon
              return (
                <div
                  key={contact.name}
                  className="group rounded-2xl border border-border/60 bg-card/80 p-6 transition hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5"
                >
                  <div className="mb-3 flex items-center gap-3">
                    <div className="rounded-xl bg-primary/10 p-2.5">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">{contact.name}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{contact.description}</p>
                  <Link
                    href={`mailto:${contact.email}`}
                    className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-primary transition hover:underline"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    {contact.email}
                  </Link>
                  {'hasSponsoringPdf' in contact && contact.hasSponsoringPdf && (
                    <a
                      href={SPONSORING_PDF_URL}
                      download
                      className="mt-3 inline-flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-xs font-semibold text-primary transition hover:bg-primary/20"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Télécharger le Dossier Sponsoring
                    </a>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative isolate overflow-hidden py-20 sm:py-28">
        <div className="absolute inset-0">
          <Image
            src="/images/images/a-photograph-in-action.avif"
            alt="Événement Overbound"
            fill
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/60" />
        </div>
        <div className="pointer-events-none absolute -left-20 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 top-1/3 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />

        <div className="container relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-black tracking-tight text-primary-foreground sm:text-5xl">
            Envie de couvrir Overbound ?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-primary-foreground/80 sm:text-lg">
            Contactez notre équipe pour obtenir des accréditations, des interviews ou toute information complémentaire.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button
              asChild
              size="lg"
              className="h-14 rounded-2xl bg-primary px-10 text-lg font-bold text-primary-foreground shadow-xl shadow-primary/25 hover:bg-primary/90"
            >
              <a href={SPONSORING_PDF_URL} download>
                <Download className="mr-2 h-5 w-5" />
                Dossier Sponsoring 2026
              </a>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-14 rounded-2xl border-2 border-primary-foreground/30 bg-transparent px-10 text-lg font-semibold text-primary-foreground hover:bg-white/10"
            >
              <Link href="mailto:presse@overbound-race.com">
                <Mail className="mr-2 h-5 w-5" />
                Écrire à l&apos;équipe presse
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
}
