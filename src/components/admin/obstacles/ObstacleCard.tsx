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
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold truncate">{obstacle.name}</h3>
              <Badge variant="secondary">{obstacle.type}</Badge>
              <span className={`px-2 py-1 rounded text-xs ${difficultyColor(obstacle.difficulty)}`}>
                Difficulté {obstacle.difficulty}/10
              </span>
            </div>

            {obstacle.description ? (
              <p className="text-sm text-muted-foreground line-clamp-3">{obstacle.description}</p>
            ) : (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Aucune description fournie
              </p>
            )}

            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              {obstacle.image_url && <span>Image disponible</span>}
              {obstacle.video_url && <span>Vidéo disponible</span>}
            </div>
          </div>

          <div className="flex items-center gap-2 ml-4">
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
