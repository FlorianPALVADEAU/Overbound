'use client'

import type { Race } from '@/types/Race'
import { RaceCard } from './RaceCard'

interface RaceListProps {
  races: Race[]
  onEdit: (race: Race) => void
  onDelete: (race: Race) => void
  deleteLoadingId?: string | null
}

export function RaceList({ races, onEdit, onDelete, deleteLoadingId }: RaceListProps) {
  return (
    <div className="grid gap-4">
      {races.map((race) => (
        <RaceCard
          key={race.id}
          race={race}
          onEdit={onEdit}
          onDelete={onDelete}
          isDeleting={deleteLoadingId === race.id}
        />
      ))}
    </div>
  )
}
