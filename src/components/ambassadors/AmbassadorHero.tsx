'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DISPLAY_TITLE, Eyebrow } from '@/components/ds'
import { cn } from '@/lib/utils'

interface AmbassadorHeroProps {
  fullName?: string | null
  email?: string | null
}

export function AmbassadorHero({ fullName, email }: AmbassadorHeroProps) {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <Eyebrow>Espace ambassadeur</Eyebrow>
        <h1 className={cn(DISPLAY_TITLE, 'mt-2 text-display-md')}>{fullName || email || 'Ambassadeur'}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Programme de parrainage Overbound ·{' '}
          <a href="#conditions" className="underline underline-offset-2">
            conditions
          </a>
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="secondary">Ambassadeur</Badge>
        <Button asChild variant="outline" size="sm">
          <Link href="/account">Mon compte</Link>
        </Button>
      </div>
    </header>
  )
}
