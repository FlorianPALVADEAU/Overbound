'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Obstacle } from '@/types/Obstacle'

interface ObstaclePreviewDialogProps {
  obstacle: Obstacle | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ObstaclePreviewDialog({ obstacle, open, onOpenChange }: ObstaclePreviewDialogProps) {
  if (!obstacle) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{obstacle.name}</DialogTitle>
          <DialogDescription>{obstacle.type}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {obstacle.description && <p className="text-sm text-muted-foreground">{obstacle.description}</p>}

          {(obstacle.metric_label || obstacle.weight_male || obstacle.weight_female || obstacle.penalty) && (
            <div className="grid gap-2 rounded border p-3 text-sm">
              <p className="font-medium">Spécifications</p>
              {obstacle.metric_label && obstacle.metric_value ? (
                <p className="text-muted-foreground">
                  {obstacle.metric_label} : {obstacle.metric_value}
                </p>
              ) : null}
              {(obstacle.weight_male || obstacle.weight_female) ? (
                <p className="text-muted-foreground">
                  Charge :{' '}
                  {[
                    obstacle.weight_male ? `${obstacle.weight_male} (H)` : null,
                    obstacle.weight_female ? `${obstacle.weight_female} (F)` : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              ) : null}
              {obstacle.penalty ? (
                <p className="text-muted-foreground">Pénalité : {obstacle.penalty}</p>
              ) : null}
            </div>
          )}

          {(obstacle.image_url || obstacle.video_url) && (
            <div className="grid gap-4">
              {obstacle.image_url && (
                <div>
                  <p className="text-sm font-medium mb-2">Image</p>
                  <img
                    src={obstacle.image_url}
                    alt={obstacle.name}
                    className="w-full rounded border"
                  />
                </div>
              )}

              {obstacle.video_url && (
                <div>
                  <p className="text-sm font-medium mb-2">Vidéo</p>
                  <video controls className="w-full rounded border">
                    <source src={obstacle.video_url} />
                  </video>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
