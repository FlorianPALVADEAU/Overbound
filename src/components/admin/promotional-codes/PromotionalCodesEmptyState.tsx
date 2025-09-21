'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Percent, Plus } from 'lucide-react'

interface PromotionalCodesEmptyStateProps {
  onCreate: () => void
}

export function PromotionalCodesEmptyState({ onCreate }: PromotionalCodesEmptyStateProps) {
  return (
    <Card>
      <CardContent className="text-center py-12">
        <Percent className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Aucun code promotionnel</h3>
        <p className="text-muted-foreground mb-4">Ajoutez un code pour offrir des réductions.</p>
        <Button onClick={onCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau code
        </Button>
      </CardContent>
    </Card>
  )
}
