'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface AmbassadorHeroProps {
  fullName?: string | null
  email?: string | null
}

export function AmbassadorHero({ fullName, email }: AmbassadorHeroProps) {
  return (
    <>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Espace Ambassadeur
          </p>
          <h1 className="text-2xl font-bold sm:text-3xl">{fullName || email || 'Ambassadeur'}</h1>
          <p className="text-sm text-muted-foreground">Programme de parrainage Overbound</p>
          <p className="text-sm text-muted-foreground">
            <a href="#conditions" className="underline">Voir les conditions du programme</a>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">Ambassadeur</Badge>
          <Link href="/account">
            <Button variant="outline" size="sm">Mon compte</Button>
          </Link>
        </div>
      </header>

      <div className="relative overflow-hidden rounded-2xl border border-border/60">
        <img
          src="/images/images/overbound-headband-on-chains-with-grass-in-background.avif"
          alt="Ambassadeur Overbound"
          className="h-[200px] w-full object-cover sm:h-[300px]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/70 via-background/30 to-transparent" />
        <div className="absolute left-5 top-5 max-w-xs">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Ambassadeur</p>
          <p className="mt-1 text-lg font-bold text-foreground">Fais grandir la communauté</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Partage ton code et débloque les paliers.
          </p>
        </div>
      </div>
    </>
  )
}
