'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Copy, Share2 } from 'lucide-react'

interface AmbassadorCodeCardProps {
  code: string | null
  copyFeedback: 'idle' | 'copied'
  onCopy: () => void
  onShare: () => void
}

export function AmbassadorCodeCard({ code, copyFeedback, onCopy, onShare }: AmbassadorCodeCardProps) {
  return (
    <Card variant="feature" className="gap-0 py-0">
      <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="min-w-0">
          <p className="text-label font-semibold uppercase text-subtle">Ton code ambassadeur</p>
          {code ? (
            <>
              <p className="mt-1 break-all font-display text-display-md font-bold uppercase tracking-tight text-primary">
                {code}
              </p>
              <p className="mt-1 max-w-md text-xs text-muted-foreground">
                Tes filleuls obtiennent une réduction, toi tu gagnes des points.
              </p>
            </>
          ) : (
            <>
              <p className="mt-1 text-title font-semibold text-muted-foreground">Non configuré</p>
              <p className="mt-1 text-xs text-muted-foreground">Contacte l&apos;équipe Overbound pour associer ton code.</p>
            </>
          )}
        </div>
        <div className="grid shrink-0 grid-cols-2 gap-2 sm:flex">
          <Button variant="outline" size="cta" onClick={onCopy} disabled={!code}>
            <Copy />
            {copyFeedback === 'copied' ? 'Copié !' : 'Copier'}
          </Button>
          <Button size="cta" onClick={onShare} disabled={!code}>
            <Share2 />
            Partager
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
