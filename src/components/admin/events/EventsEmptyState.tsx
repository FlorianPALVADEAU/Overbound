'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Calendar, Plus } from 'lucide-react'

interface EventsEmptyStateProps {
  onCreate: () => void
}

export function EventsEmptyState({ onCreate }: EventsEmptyStateProps) {
  return (
    <Card>
      <CardContent className="text-center py-12">
        <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Aucun événement</h3>
        <p className="text-muted-foreground mb-4">
          Commencez par créer votre premier événement.
        </p>
        <Button onClick={onCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Créer un événement
        </Button>
      </CardContent>
    </Card>
  )
}
