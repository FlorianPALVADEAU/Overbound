'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PARTNERS_DATA } from '@/datas/Partners'
import {
  Handshake,
  Download,
  Mail,
  Heart,
  Target,
  Eye,
  Users,
} from 'lucide-react'

const SPONSORING_PDF_URL = '/images/brand/Overbound – Dossier Sponsoring 2026.pdf'

const WHY_PARTNER = [
  {
    icon: Eye,
    title: 'Visibilité premium',
    description:
      "Logo sur tous nos supports (site, réseaux sociaux, signalétique événement), stand partenaire sur le village et mentions dans nos communications.",
  },
  {
    icon: Users,
    title: 'Communauté engagée',
    description:
      "Accédez à une audience passionnée de sport outdoor, engagée et active sur les réseaux sociaux. Un public qualifié et réceptif à vos messages.",
  },
  {
    icon: Heart,
    title: 'Valeurs partagées',
    description:
      "Associez votre marque à des valeurs fortes : dépassement de soi, bienveillance, esprit d'équipe et respect de la nature.",
  },
  {
    icon: Target,
    title: 'Activation sur-mesure',
    description:
      "Nous construisons ensemble des activations adaptées à vos objectifs : sampling, animations, challenges personnalisés, contenus co-brandés.",
  },
]

export default function PartnersPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-muted/10 to-background text-foreground">
      {/* Hero */}
      <section className="relative isolate overflow-hidden py-40 sm:py-44">
        <div className="absolute inset-0">
          <Image
            src="/images/images/an-armed-crossed-man-talking-in-a-middle-of-a-circle-of-people.avif"
            alt="Partenaires Overbound"
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
              Partenaires
            </span>
            <h1 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
              Ils nous font confiance
            </h1>
            <p className="text-base leading-relaxed text-muted-foreground sm:text-lg md:text-xl">
              Overbound est soutenu par des partenaires engagés qui partagent notre vision du sport outdoor et du dépassement de soi.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button asChild size="lg" className="h-12 shadow-lg shadow-primary/25">
                <a href={SPONSORING_PDF_URL} download>
                  <Download className="mr-2 h-5 w-5" />
                  Dossier Sponsoring 2026
                </a>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-12 border-primary text-primary hover:bg-primary/10">
                <Link href="/contact?subject=partenariat">
                  <Handshake className="mr-2 h-4 w-4" />
                  Devenir partenaire
                </Link>
              </Button>
            </div>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-[-10%] flex justify-center opacity-70">
          <Image
            src="/images/decorations/mountain-vector.svg"
            alt="Décor montagne"
            width={1600}
            height={800}
            className="w-[220%] max-w-none sm:w-[170%] md:w-[140%]"
          />
        </div>
      </section>

      {/* Grille partenaires */}
      <section className="bg-background py-16 sm:py-20">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 space-y-2 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
              Écosystème
            </p>
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">Nos partenaires</h2>
            <p className="mx-auto max-w-2xl text-sm text-muted-foreground sm:text-base">
              Des marques et institutions qui contribuent à faire d&apos;Overbound une expérience unique.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:gap-8">
            {PARTNERS_DATA.map((partner) => (
              <div
                key={partner.name}
                className="group flex flex-col items-center justify-center gap-4 rounded-2xl border border-border/60 bg-card/80 p-8 transition hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 sm:p-10"
              >
                <div className="relative h-16 w-full sm:h-20">
                  <Image
                    src={partner.logo}
                    alt={partner.name}
                    fill
                    sizes="(max-width: 640px) 40vw, 200px"
                    className="object-contain transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <p className="text-sm font-medium text-muted-foreground text-center">{partner.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pourquoi devenir partenaire */}
      <section className="relative overflow-hidden py-16 sm:py-20">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
        <div className="pointer-events-none absolute -right-32 top-10 h-72 w-72 rounded-full bg-primary/8 blur-3xl" />
        <div className="container relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 space-y-2 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
              Opportunités
            </p>
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">Pourquoi nous rejoindre ?</h2>
            <p className="mx-auto max-w-2xl text-sm text-muted-foreground sm:text-base">
              Rejoignez l&apos;aventure Overbound et bénéficiez d&apos;une visibilité unique auprès d&apos;une communauté engagée.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {WHY_PARTNER.map((item) => {
              const Icon = item.icon
              return (
                <div
                  key={item.title}
                  className="group rounded-2xl border border-border/60 bg-card/80 p-6 transition hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5"
                >
                  <div className="mb-3 flex items-center gap-3">
                    <div className="rounded-xl bg-primary/10 p-2.5">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

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
            Rejoignez l&apos;aventure Overbound
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-primary-foreground/80 sm:text-lg">
            Vous souhaitez associer votre marque à un événement sportif unique et fédérateur ? Parlons-en.
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
              <Link href="/contact?subject=partenariat">
                <Mail className="mr-2 h-5 w-5" />
                Nous contacter
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
}
