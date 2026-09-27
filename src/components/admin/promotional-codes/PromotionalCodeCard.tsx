'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { PromotionalCode } from '@/types/PromotionalCode'
import { Calendar, CheckCircle, Edit, Percent, Trash2 } from 'lucide-react'
import { Clock } from 'lucide-react'

interface PromotionalCodeCardProps {
  promotionalCode: PromotionalCode
  onEdit: (code: PromotionalCode) => void
  onDelete: (code: PromotionalCode) => void
  isDeleting?: boolean
}

function formatDiscount(code: PromotionalCode) {
  if (code.discount_percent) {
    return `${code.discount_percent}%`
  }
  if (code.discount_amount) {
    return `${(code.discount_amount / 100).toFixed(2)} ${code.currency.toUpperCase()}`
  }
  return '—'
}

export function PromotionalCodeCard({ promotionalCode, onEdit, onDelete, isDeleting }: PromotionalCodeCardProps) {
  const validFrom = new Date(promotionalCode.valid_from)
  const validUntil = new Date(promotionalCode.valid_until)
  const isActive = promotionalCode.is_active
  const usageInfo = promotionalCode.usage_limit
    ? `${promotionalCode.used_count}/${promotionalCode.usage_limit}`
    : `${promotionalCode.used_count}`

  return (
    <Card>
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col gap-4">
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="max-w-full truncate">{promotionalCode.code}</Badge>
              <Badge variant="outline">{formatDiscount(promotionalCode)}</Badge>
              {isActive ? (
                <Badge variant="default" className="bg-green-600 hover:bg-green-600">
                  Actif
                </Badge>
              ) : (
                <Badge variant="outline">Inactif</Badge>
              )}
            </div>

            <div>
              <p className="truncate font-semibold" title={promotionalCode.name}>{promotionalCode.name}</p>
              {promotionalCode.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">{promotionalCode.description}</p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-3 sm:gap-4">
              <div className="flex min-w-0 items-center gap-2">
                <Percent className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">Usage : {usageInfo}</span>
              </div>
              <div className="flex min-w-0 items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">{validFrom.toLocaleDateString('fr-FR')} → {validUntil.toLocaleDateString('fr-FR')}</span>
              </div>
              <div className="flex min-w-0 items-center gap-2">
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">{promotionalCode.events?.length || 0} événement(s)</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-border pt-3 sm:border-0 sm:pt-0">
            <Button variant="outline" size="sm" onClick={() => onEdit(promotionalCode)} aria-label={`Modifier ${promotionalCode.code}`}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(promotionalCode)}
              disabled={isDeleting}
              aria-label={`Supprimer ${promotionalCode.code}`}
            >
              {isDeleting ? <Clock className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
