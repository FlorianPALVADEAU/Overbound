'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { Upsell } from '@/types/Upsell'
import { Box, CheckCircle, Edit, Store, Trash2 } from 'lucide-react'
import { Clock } from 'lucide-react'

interface UpsellCardProps {
  upsell: Upsell
  onEdit: (upsell: Upsell) => void
  onDelete: (upsell: Upsell) => void
  isDeleting?: boolean
}

function formatPrice(price: number, currency: Upsell['currency']) {
  return `${(price / 100).toFixed(2)} ${(currency || 'eur').toUpperCase()}`
}

export function UpsellCard({ upsell, onEdit, onDelete, isDeleting }: UpsellCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="font-semibold truncate">{upsell.name}</h3>
              <Badge variant="secondary">{upsell.type}</Badge>
              <Badge variant="outline">{formatPrice(upsell.price_cents, upsell.currency)}</Badge>
              {upsell.is_active ? (
                <Badge variant="default" className="bg-green-600 hover:bg-green-600">
                  Actif
                </Badge>
              ) : (
                <Badge variant="outline">Inactif</Badge>
              )}
            </div>

            {upsell.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">{upsell.description}</p>
            )}

            {upsell.type === 'tshirt' && upsell.options?.sizes && upsell.options.sizes.length > 0 ? (
              <p className="text-xs text-muted-foreground">
                Tailles : {upsell.options.sizes.join(', ')}
              </p>
            ) : null}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Store className="h-4 w-4 text-muted-foreground" />
                <span>{upsell.event_id ? 'Associé à un événement' : 'Disponible globalement'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Box className="h-4 w-4 text-muted-foreground" />
                <span>
                  Stock : {upsell.stock_quantity !== null && upsell.stock_quantity !== undefined ? upsell.stock_quantity : 'Illimité'}
                </span>
              </div>
              {upsell.is_active && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  <span>En vente</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => onEdit(upsell)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(upsell)}
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
