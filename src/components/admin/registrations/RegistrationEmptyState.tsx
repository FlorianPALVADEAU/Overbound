'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Users } from 'lucide-react'

interface RegistrationEmptyStateProps {
  hasFilters: boolean
}

export function RegistrationEmptyState({ hasFilters }: RegistrationEmptyStateProps) {
  return (
    <Card>
      <CardContent className="text-center py-12">
        <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Aucune inscription</h3>
        <p className="text-muted-foreground">
          {hasFilters ? 'Aucun résultat pour ces filtres' : 'Aucune inscription trouvée'}
        </p>
      </CardContent>
    </Card>
  )
}
