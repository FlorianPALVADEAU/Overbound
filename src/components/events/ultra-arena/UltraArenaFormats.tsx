'use client'

import Link from 'next/link'
import { Heart, Swords, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const OPEN_FOR_WHO = [
  "Tu découvres Overbound pour la 1ère fois",
  "Tu veux te dépasser sans pression de temps",
  "Tu viens entre amis, en couple ou en famille",
  "Tu préfères gérer ton propre rythme et tes pauses",
]

const RANKED_FOR_WHO = [
  "Tu aimes la pression et le duel mental",
  "Tu veux un vrai classement avec élimination réelle",
  "Tu cherches la compétition encadrée et intense",
  "Tu veux savoir jusqu'où tu peux aller — vraiment",
]

interface Ticket {
  id: string
}

interface Props {
  isOnSale: boolean
  openTicket?: Ticket | null
  rankedTicket?: Ticket | null
  registerHref: (ticketId?: string) => string
  onOpenClick: () => void
  onRankedClick: () => void
  onMidCtaClick?: () => void
}

export function UltraArenaFormats({
  isOnSale,
  openTicket,
  rankedTicket,
  registerHref,
  onOpenClick,
  onRankedClick,
  onMidCtaClick,
}: Props) {
  return (
    <section id="formats" className="relative isolate overflow-hidden py-16 sm:py-20">
      <div className="absolute inset-0">
        <img
          src="/images/images/lot-of-runner-going-everywhere-with-chains-on-their-necks.avif"
          alt=""
          className="h-full w-full object-cover opacity-14"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-linear-to-br from-background/92 via-background/95 to-background" />
      </div>
      <div className="container relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-primary">Formats</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
            Choisis ton mode de jeu.
          </h2>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Tu n'as pas besoin d'être un monstre pour entrer dans l'arène. Tu choisis simplement le format
            qui correspond à ce que tu veux vivre.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* OPEN */}
          <Card className="flex flex-col border-blue-500/30 bg-linear-to-br from-blue-500/5 via-card to-card shadow-lg shadow-blue-500/5">
            <CardHeader>
              <div className="mb-2 flex items-center justify-between">
                <Badge className="border-0 bg-blue-500/15 text-blue-600">Accessible à tous</Badge>
                <Heart className="h-5 w-5 text-blue-600" />
              </div>
              <CardTitle className="text-2xl font-black">OPEN</CardTitle>
              <p className="text-sm text-muted-foreground">
                Sans élimination. Tu gères ton rythme, tes pauses, ta stratégie. L'objectif, c'est le tien.
              </p>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-5">
              <div>
                <p className="mb-2.5 text-xs font-bold uppercase tracking-wider text-blue-600">
                  Ce format est pour toi si...
                </p>
                <ul className="space-y-2">
                  {OPEN_FOR_WHO.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-auto pt-2">
                {isOnSale ? (
                  <Button
                    asChild
                    className="w-full bg-blue-600 text-white hover:bg-blue-700"
                    onClick={onOpenClick}
                  >
                    <Link href={registerHref(openTicket?.id)}>Je choisis OPEN</Link>
                  </Button>
                ) : (
                  <Button className="w-full" variant="outline" disabled>
                    Inscriptions à venir
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* RANKED */}
          <Card className="flex flex-col border-amber-500/30 bg-linear-to-br from-amber-500/5 via-card to-card shadow-lg shadow-amber-500/5">
            <CardHeader>
              <div className="mb-2 flex items-center justify-between">
                <Badge className="border-0 bg-amber-500/15 text-amber-600">Format compétitif</Badge>
                <Swords className="h-5 w-5 text-amber-600" />
              </div>
              <CardTitle className="text-2xl font-black">RANKED</CardTitle>
              <p className="text-sm text-muted-foreground">
                Élimination progressive. Un départ toutes les 20 minutes. Tu termines dans les temps — ou tu
                sors.
              </p>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-5">
              <div>
                <p className="mb-2.5 text-xs font-bold uppercase tracking-wider text-amber-600">
                  Ce format est pour toi si...
                </p>
                <ul className="space-y-2">
                  {RANKED_FOR_WHO.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-auto pt-2">
                {isOnSale ? (
                  <Button
                    asChild
                    className="w-full bg-amber-600 text-white hover:bg-amber-700"
                    onClick={onRankedClick}
                  >
                    <Link href={registerHref(rankedTicket?.id)}>Je choisis RANKED</Link>
                  </Button>
                ) : (
                  <Button className="w-full" variant="outline" disabled>
                    Inscriptions à venir
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <p className="mt-5 text-center text-xs text-muted-foreground">
          Pas encore sûr(e) ? Tous les détails des billets avec les prix exacts sont disponibles plus bas.
        </p>
      </div>
    </section>
  )
}
