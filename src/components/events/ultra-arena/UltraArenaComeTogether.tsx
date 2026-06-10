'use client'

import Link from 'next/link'
import { Users, Heart, User } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface Props {
  isOnSale: boolean
  registerHref: string
  onCtaClick?: () => void
}

const GROUP_OPTIONS = [
  {
    icon: Users,
    title: 'Entre potes',
    body: 'Challenge, fun et souvenirs. Vous vous tirez vers le haut, tour après tour.',
  },
  {
    icon: Heart,
    title: 'En couple',
    body: 'Une expérience à deux, intense et mémorable, loin des sorties classiques.',
  },
  {
    icon: User,
    title: 'Solo',
    body: 'Tu viens seul, tu repars plus fort. C’est ton terrain de dépassement personnel.',
  },
]

export function UltraArenaComeTogether({ isOnSale, registerHref, onCtaClick }: Props) {
  return (
    <section className="relative isolate overflow-hidden py-16 sm:py-20">
      <div className="absolute inset-0">
        <img
          src="/images/images/a-group-of-friends-celebrating-after-a-hard-obstacle.avif"
          alt=""
          className="h-full w-full object-cover object-[center_40%] opacity-20"
          loading="lazy"
        />
      </div>
      <div className="container relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-primary">Dynamique de groupe</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Tu viens avec qui ?</h2>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Le choix t&apos;appartient. Ce qui compte: décider d&apos;y aller.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {GROUP_OPTIONS.map(({ icon: Icon, title, body }) => (
            <Card key={title} className="border-primary/15 bg-linear-to-br from-card/95 to-card/80">
              <CardContent className="p-6">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{body}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 text-center">
          {isOnSale ? (
            <Button asChild size="lg" className="h-12 rounded-xl px-8 text-base font-semibold" onClick={onCtaClick}>
              <Link href={registerHref}>On y va à plusieurs 🔥</Link>
            </Button>
          ) : (
            <Button asChild size="lg" variant="outline" className="h-12 rounded-xl px-8">
              <a href="#formats">Voir les formats</a>
            </Button>
          )}
        </div>
      </div>
    </section>
  )
}
