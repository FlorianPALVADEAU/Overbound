'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Ticket as TicketIcon } from 'lucide-react'

interface TicketsEmptyStateProps {
  onCreate: () => void
}

export function TicketsEmptyState({ onCreate }: TicketsEmptyStateProps) {
  return (
    <Card>
      <CardContent className="text-center py-12">
        <TicketIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Aucun ticket</h3>
        <p className="text-muted-foreground mb-4">Ajoutez vos billets pour vos événements.</p>
        <Button onClick={onCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Créer un ticket
        </Button>
      </CardContent>
    </Card>
  )
}
