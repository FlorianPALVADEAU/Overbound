'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PackagePlus } from 'lucide-react'

interface UpsellsEmptyStateProps {
  onCreate: () => void
}

export function UpsellsEmptyState({ onCreate }: UpsellsEmptyStateProps) {
  return (
    <Card>
      <CardContent className="text-center py-12">
        <PackagePlus className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Aucun upsell</h3>
        <p className="text-muted-foreground mb-4">Ajoutez des produits complémentaires pour vos participants.</p>
        <Button onClick={onCreate}>
          <PackagePlus className="h-4 w-4 mr-2" />
          Nouvel upsell
        </Button>
      </CardContent>
    </Card>
  )
}
