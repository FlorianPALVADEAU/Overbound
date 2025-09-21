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
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="secondary">{promotionalCode.code}</Badge>
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
              <p className="font-semibold">{promotionalCode.name}</p>
              {promotionalCode.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">{promotionalCode.description}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Percent className="h-4 w-4 text-muted-foreground" />
                <span>Usage : {usageInfo}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{validFrom.toLocaleDateString('fr-FR')} → {validUntil.toLocaleDateString('fr-FR')}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                <span>{promotionalCode.events?.length || 0} événement(s)</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => onEdit(promotionalCode)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(promotionalCode)}
              disabled={isDeleting}
            >
              {isDeleting ? <Clock className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
