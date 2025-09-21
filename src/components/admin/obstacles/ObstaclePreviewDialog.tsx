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
