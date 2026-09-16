'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Clock, Package } from 'lucide-react'
import { useUpsellsSummary } from '@/app/api/admin/registrations/upsells-summary/upsellsSummaryQueries'

const formatAmount = (cents: number, currency: string) =>
  (cents / 100).toLocaleString('fr-FR', {
    style: 'currency',
    currency: currency.toUpperCase(),
  })

interface UpsellSummaryPanelProps {
  eventId?: string
}

export function UpsellSummaryPanel({ eventId }: UpsellSummaryPanelProps) {
  const { data, isLoading } = useUpsellsSummary(eventId)

  const summary = data?.summary ?? []

  if (!isLoading && summary.length === 0) return null

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Package className="h-4 w-4 text-primary" />
          Options vendues (upsells)
          {eventId ? null : (
            <span className="text-xs font-normal text-muted-foreground ml-1">— tous événements</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex items-center gap-2 px-6 py-4 text-sm text-muted-foreground">
            <Clock className="h-4 w-4 animate-spin" />
            Chargement…
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Option</TableHead>
                <TableHead>Détails</TableHead>
                <TableHead className="text-center w-24">Qté vendue</TableHead>
                <TableHead className="text-right w-36">CA total</TableHead>
                <TableHead className="text-right w-36">Prix unitaire moy.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary.map((row) => (
                <TableRow key={`${row.name}-${row.currency}`}>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {Array.isArray(row.specs_breakdown) && row.specs_breakdown.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {row.specs_breakdown.map((item) => (
                          <Badge key={`${row.name}-${item.label}`} variant="outline" className="text-xs">
                            {item.label} x{item.quantity}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span>-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center tabular-nums">
                    <Badge variant="secondary">{row.quantity}</Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-medium text-green-600">
                    {formatAmount(row.total_cents, row.currency)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground text-sm">
                    {formatAmount(Math.round(row.total_cents / row.quantity), row.currency)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
