'use client'

import type { Obstacle } from '@/types/Obstacle'
import { ObstacleCard } from './ObstacleCard'

interface ObstacleListProps {
  obstacles: Obstacle[]
  onEdit: (obstacle: Obstacle) => void
  onDelete: (obstacle: Obstacle) => void
  onPreview: (obstacle: Obstacle) => void
  deleteLoadingId?: string | null
}

export function ObstacleList({ obstacles, onEdit, onDelete, onPreview, deleteLoadingId }: ObstacleListProps) {
  return (
    <div className="grid gap-4">
      {obstacles.map((obstacle) => (
        <ObstacleCard
          key={obstacle.id}
          obstacle={obstacle}
          onEdit={onEdit}
          onDelete={onDelete}
          onPreview={onPreview}
          isDeleting={deleteLoadingId === obstacle.id}
        />
      ))}
    </div>
  )
}
