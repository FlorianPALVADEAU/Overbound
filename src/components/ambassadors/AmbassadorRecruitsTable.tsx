'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronUp, Share2, Users } from 'lucide-react'
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
  isOpen: boolean
  onToggle: () => void
  onShare: () => void
}

export function AmbassadorRecruitsTable({ recruits, code, isOpen, onToggle, onShare }: AmbassadorRecruitsTableProps) {
  return (
    <Card>
      <CardHeader className="pb-0 pt-5">
        <button type="button" onClick={onToggle} className="flex w-full items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" />
            Mes filleuls
            {recruits.length > 0 && <Badge variant="secondary">{recruits.length}</Badge>}
          </CardTitle>
          {isOpen ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
      </CardHeader>

      <div
        className={cn(
          'transition-all duration-200 ease-in-out',
          isOpen ? 'max-h-[700px] overflow-y-auto' : 'max-h-0 overflow-hidden',
        )}
      >
        <CardContent className="pt-4">
          {recruits.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <Users className="h-10 w-10 text-muted-foreground/25" />
              <div>
                <p className="font-medium text-muted-foreground">
                  Personne n&apos;a encore utilisé ton code.
                </p>
                <p className="mt-1 text-sm text-muted-foreground/60">
                  Commence à partager pour voir tes filleuls apparaître ici !
                </p>
              </div>
              {code && (
                <Button size="sm" variant="outline" onClick={onShare} className="gap-2">
                  <Share2 className="h-3.5 w-3.5" />
                  Partager mon code
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
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
                      <TableCell className="text-sm font-medium">
                        {row.name ?? 'Utilisateur'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatAmbassadorDate(row.signup_date)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {FORMAT_LABELS[row.race_format]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn('text-xs', PAYMENT_STATUS_STYLES[row.payment_status])}>
                          {PAYMENT_STATUS_LABELS[row.payment_status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-semibold">
                        {row.points > 0 ? (
                          <span className="text-primary">+{row.points}</span>
                        ) : (
                          <span className="text-muted-foreground/40">0</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </div>
    </Card>
  )
}
