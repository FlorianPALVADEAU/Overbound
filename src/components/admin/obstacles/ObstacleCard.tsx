'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { Obstacle } from '@/types/Obstacle'
import { AlertCircle, Edit, Eye, Trash2 } from 'lucide-react'
import { Clock } from 'lucide-react'

interface ObstacleCardProps {
  obstacle: Obstacle
  onEdit: (obstacle: Obstacle) => void
  onDelete: (obstacle: Obstacle) => void
  onPreview?: (obstacle: Obstacle) => void
  isDeleting?: boolean
}

function difficultyColor(difficulty: number) {
  if (difficulty >= 8) return 'bg-red-100 text-red-800'
  if (difficulty >= 5) return 'bg-yellow-100 text-yellow-800'
  return 'bg-green-100 text-green-800'
}

export function ObstacleCard({ obstacle, onEdit, onDelete, onPreview, isDeleting }: ObstacleCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-base font-semibold truncate">{obstacle.name}</h3>
              <Badge variant="secondary" className="text-xs">{obstacle.type}</Badge>
              <span className={`px-1.5 py-0.5 rounded text-xs ${difficultyColor(obstacle.difficulty)}`}>
                {obstacle.difficulty}/10
              </span>
            </div>

            {obstacle.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-1">{obstacle.description}</p>
            )}

            {(obstacle.image_url || obstacle.video_url) && (
              <div className="flex gap-2 text-xs text-muted-foreground">
                {obstacle.image_url && <span>📷</span>}
                {obstacle.video_url && <span>🎥</span>}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            {onPreview && (
              <Button variant="outline" size="sm" onClick={() => onPreview(obstacle)}>
                <Eye className="h-4 w-4" />
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => onEdit(obstacle)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(obstacle)}
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
