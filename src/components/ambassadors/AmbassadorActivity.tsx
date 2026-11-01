'use client'

import { useState } from 'react'
import { Users } from 'lucide-react'
import { Disclosure } from '@/components/ds'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FORMAT_LABELS, formatAmbassadorDate, PAYMENT_STATUS_LABELS, PAYMENT_STATUS_STYLES } from '@/lib/ambassadors/dashboardPresentation'
import type { AmbassadorRecruitRow } from '@/types/Ambassador'
import { cn } from '@/lib/utils'

interface AmbassadorActivityProps {
  recruits: AmbassadorRecruitRow[]
  onShare: () => void
}

const PREVIEW_SIZE = 5

function PointsCell({ recruit }: { recruit: AmbassadorRecruitRow }) {
  if (recruit.points_status === 'counted') return <span className="font-semibold text-success">+{recruit.points} pt{recruit.points > 1 ? 's' : ''}</span>
  if (recruit.points_status === 'revoked') return <span className="font-semibold text-destructive">Annulé</span>
  if (recruit.payment_status === 'pending') return <Badge className={PAYMENT_STATUS_STYLES.pending}>{PAYMENT_STATUS_LABELS.pending}</Badge>
  return <span className="text-muted-foreground">0 pt</span>
}

export function AmbassadorActivity({ recruits, onShare }: AmbassadorActivityProps) {
  const [showAll, setShowAll] = useState(false)
  const visible = showAll ? recruits : recruits.slice(0, PREVIEW_SIZE)

  return (
    <Disclosure
      icon={<Users className="size-4" />}
      title="Mes filleuls"
      badge={recruits.length > 0 ? <Badge variant="outline">{recruits.length}</Badge> : null}
      summary={recruits.length > 0 ? 'Les inscriptions faites avec ton code' : 'Personne pour le moment'}
      defaultOpen={recruits.length > 0}
    >
      {recruits.length === 0 ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Aucune inscription avec ton code pour l&apos;instant. Envoie-le à trois amis, un seul suffit pour gagner ton premier point.</p>
          <Button variant="outline" size="cta" onClick={onShare}>
            Partager mon code
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <ul className="divide-y divide-border">
            {visible.map((recruit) => (
              <li key={recruit.id} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className={cn('truncate font-medium', recruit.points_status === 'revoked' && 'text-muted-foreground line-through')}>{recruit.name ?? 'Participant'}</p>
                  <p className="text-xs text-muted-foreground">
                    {FORMAT_LABELS[recruit.race_format]} · {formatAmbassadorDate(recruit.signup_date)}
                  </p>
                </div>
                <div className="shrink-0 text-sm">
                  <PointsCell recruit={recruit} />
                </div>
              </li>
            ))}
          </ul>
          {recruits.length > PREVIEW_SIZE ? (
            <Button variant="ghost" size="cta" className="w-full" onClick={() => setShowAll((value) => !value)}>
              {showAll ? 'Voir moins' : `Voir les ${recruits.length} filleuls`}
            </Button>
          ) : null}
        </div>
      )}
    </Disclosure>
  )
}
