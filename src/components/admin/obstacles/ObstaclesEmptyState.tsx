'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Zap } from 'lucide-react'

interface ObstaclesEmptyStateProps {
  onCreate: () => void
}

export function ObstaclesEmptyState({ onCreate }: ObstaclesEmptyStateProps) {
  return (
    <Card>
      <CardContent className="text-center py-12">
        <Zap className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Aucun obstacle</h3>
        <p className="text-muted-foreground mb-4">
          Ajoutez vos obstacles pour composer les courses.
        </p>
        <Button onClick={onCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Créer un obstacle
        </Button>
      </CardContent>
    </Card>
  )
}
