'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { Race } from '@/types/Race'
import { Mountain, Star, Target } from 'lucide-react'
import { Clock, Edit, Trash2 } from 'lucide-react'

interface RaceCardProps {
  race: Race
  onEdit: (race: Race) => void
  onDelete: (race: Race) => void
  isDeleting?: boolean
}

function difficultyLabel(value: number) {
  if (value >= 8) return 'Très difficile'
  if (value >= 5) return 'Intermédiaire'
  return 'Accessible'
}

export function RaceCard({ race, onEdit, onDelete, isDeleting }: RaceCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold truncate">{race.name}</h3>
              <Badge variant="secondary">{race.type}</Badge>
              <Badge variant="outline">{race.target_public}</Badge>
            </div>

            {race.description && <p className="text-sm text-muted-foreground">{race.description}</p>}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-muted-foreground" />
                <span>
                  Difficulté {race.difficulty}/10 ({difficultyLabel(race.difficulty)})
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Mountain className="h-4 w-4 text-muted-foreground" />
                <span>{race.distance_km ? `${race.distance_km} km` : 'Distance variable'}</span>
              </div>

              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <span>{race.obstacles?.length || 0} obstacles</span>
              </div>
            </div>

            {race.obstacles && race.obstacles.length > 0 && (
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">Obstacles :</span>{' '}
                {race.obstacles
                  .map((entry) => entry.obstacle.name)
                  .join(', ')}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 ml-4">
            <Button variant="outline" size="sm" onClick={() => onEdit(race)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(race)}
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
