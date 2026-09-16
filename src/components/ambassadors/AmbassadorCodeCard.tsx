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
    <Card className="border-border/60">
      <CardContent className="p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Ton code ambassadeur
            </p>
            {code ? (
              <>
                <p className="break-all text-2xl font-black tracking-[0.2em] text-primary sm:text-4xl sm:tracking-[0.3em]">
                  {code}
                </p>
                <p className="mt-2 max-w-sm text-xs text-muted-foreground">
                  Partage ce code : tes filleuls obtiennent une réduction, toi tu gagnes des points.
                </p>
              </>
            ) : (
              <>
                <p className="text-xl font-semibold text-muted-foreground">Non configuré</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Contacte l&apos;équipe Overbound pour associer ton code.
                </p>
              </>
            )}
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={onCopy} disabled={!code} className="gap-2">
              <Copy className="h-4 w-4" />
              {copyFeedback === 'copied' ? 'Copié !' : 'Copier'}
            </Button>
            <Button size="sm" onClick={onShare} disabled={!code} className="gap-2">
              <Share2 className="h-4 w-4" />
              Partager
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
