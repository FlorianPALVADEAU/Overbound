'use client'

import { Copy, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface AmbassadorShareCardProps {
  code: string | null
  copied: boolean
  onCopy: () => void
  onShare: () => void
}

export function AmbassadorShareCard({ code, copied, onCopy, onShare }: AmbassadorShareCardProps) {
  return (
    <Card variant="info" className="gap-0 py-0">
      <CardContent className="space-y-4 p-4 sm:p-6">
        <div>
          <p className="text-label font-semibold uppercase text-subtle">Mon code</p>
          {code ? (
            <p className="mt-1 break-all font-display text-display-md font-bold uppercase text-primary">{code}</p>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">Aucun code associé. Contacte l&apos;équipe Overbound.</p>
          )}
          <p className="mt-1 text-sm text-muted-foreground">Un ami qui s&apos;inscrit avec ton code a une réduction. Toi, tu gagnes des points.</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" size="cta" onClick={onCopy} disabled={!code}>
            <Copy />
            {copied ? 'Copié' : 'Copier'}
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
