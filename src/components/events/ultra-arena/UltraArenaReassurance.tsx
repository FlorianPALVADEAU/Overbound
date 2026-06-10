'use client'

import {
  Shield,
  IdCard,
  Users,
  Clock,
  Eye,
  Backpack,
  Baby,
  Camera,
  ArrowLeftRight,
  Car,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const BADGES = [
  { icon: Shield, title: 'Sécurité encadrée', text: 'Règles terrain, staff et process de contrôle sur tout le parcours.' },
  { icon: IdCard, title: 'Documents clairs', text: 'PPS valide, certificat médical, ou licence sportive. Présentés le jour J.' },
  { icon: Users, title: 'Solo ou en groupe', text: 'Tu peux participer seul ou inscrire ton groupe en une seule commande.' },
  { icon: Clock, title: 'Organisation lisible', text: "Horaires, format, logistique et règles expliqués simplement à l'avance." },
]

const EXTRA_INFOS = [
  { icon: Eye, text: 'Spectateurs bienvenus sur le village.' },
  { icon: Backpack, text: 'Dépôt de sacs prévu sur site.' },
  { icon: Baby, text: 'Événement réservé aux 18 ans et plus.' },
  { icon: Camera, text: 'Photos officielles après course.' },
  { icon: ArrowLeftRight, text: 'Modalités de transfert dans le guide coureur.' },
]

interface Props {
  location: string
  formattedTime: string
  locationMapUrl: string
}

export function UltraArenaReassurance({ location, formattedTime, locationMapUrl }: Props) {
  return (
    <section id="infos-pratiques" className="bg-muted/20 py-16 sm:py-20">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-primary">Réassurance</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
            Tu sais où tu mets les pieds.
          </h2>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Encadrement, sécurité et infos pratiques claires — avant de passer à l'inscription.
          </p>
        </div>

        {/* Badges */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {BADGES.map((item) => (
            <Card key={item.title} className="border-border/70 bg-card/80">
              <CardContent className="pt-6">
                <item.icon className="mb-3 h-5 w-5 text-primary" />
                <p className="font-semibold">{item.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Map + extra infos */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="overflow-hidden border-border/70 bg-card/80">
            <CardHeader>
              <CardTitle>Localisation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl bg-primary/5 p-3 text-sm">
                <p className="font-semibold">{location}</p>
                <p className="text-muted-foreground">
                  Départs OPEN entre {formattedTime} et 14:30. RANKED à 15:00.
                </p>
              </div>
              <div className="h-64 overflow-hidden rounded-xl border border-border/60">
                <iframe
                  title={`Carte de ${location}`}
                  src={locationMapUrl}
                  className="h-full w-full"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <div className="flex items-start gap-2 rounded-xl bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-300">
                <Car className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  <span className="font-semibold">Parking payant : 6 €/voiture.</span>{' '}
                  Le covoiturage est recommandé.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/80">
            <CardHeader>
              <CardTitle>Infos essentielles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              {EXTRA_INFOS.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-start gap-2">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {text}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
