'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Disclosure } from '@/components/ds'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { Share2, Users } from 'lucide-react'
import {
  FORMAT_LABELS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_STYLES,
  formatAmbassadorDate,
} from '@/lib/ambassadors/dashboardPresentation'
import type { AmbassadorRecruitRow } from '@/types/Ambassador'

interface AmbassadorRecruitsTableProps {
  recruits: AmbassadorRecruitRow[]
  code: string | null
  onShare: () => void
}

const pointsLabel = (points: number) =>
  points > 0 ? <span className="font-semibold text-primary">+{points}</span> : <span className="text-subtle">0</span>

export function AmbassadorRecruitsTable({ recruits, code, onShare }: AmbassadorRecruitsTableProps) {
  const paid = recruits.filter((row) => row.payment_status === 'paid').length
  return (
    <Disclosure
      icon={<Users className="size-4" />}
      title="Mes filleuls"
      badge={recruits.length > 0 ? <Badge variant="secondary">{recruits.length}</Badge> : null}
      summary={recruits.length > 0 ? `${paid} payé${paid > 1 ? 's' : ''}` : 'Personne pour le moment'}
    >
      {recruits.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <p className="text-sm text-muted-foreground">Personne n&apos;a encore utilisé ton code. Partage-le pour voir tes filleuls apparaître ici.</p>
          {code ? (
            <Button size="sm" variant="outline" onClick={onShare}>
              <Share2 />
              Partager mon code
            </Button>
          ) : null}
        </div>
      ) : (
        <>
          <ul className="divide-y divide-border md:hidden">
            {recruits.map((row) => (
              <li key={row.id} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{row.name ?? 'Utilisateur'}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatAmbassadorDate(row.signup_date)} · {FORMAT_LABELS[row.race_format]}
                  </p>
                  <Badge className={cn('mt-1', PAYMENT_STATUS_STYLES[row.payment_status])}>{PAYMENT_STATUS_LABELS[row.payment_status]}</Badge>
                </div>
                <span className="shrink-0 tabular-nums">{pointsLabel(row.points)}</span>
              </li>
            ))}
          </ul>
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Filleul</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Format</TableHead>
                  <TableHead>Paiement</TableHead>
                  <TableHead className="text-right">Points</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recruits.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="text-sm font-medium">{row.name ?? 'Utilisateur'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatAmbassadorDate(row.signup_date)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{FORMAT_LABELS[row.race_format]}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={PAYMENT_STATUS_STYLES[row.payment_status]}>{PAYMENT_STATUS_LABELS[row.payment_status]}</Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{pointsLabel(row.points)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </Disclosure>
  )
}
