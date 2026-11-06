'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cropAvatar, drawCropRegion, loadAvatarBitmap } from '@/lib/account/cropAvatar'
import { MAX_ZOOM, MIN_ZOOM, resolveCropRegion } from '@/lib/account/cropRegion'

/** Side of the square preview, in CSS pixels. The canvas is drawn at twice that for sharp screens. */
const PREVIEW_PX = 288

interface AvatarCropDialogProps {
  /** The photo just chosen. Null keeps the dialog closed. */
  file: File | null
  onCancel: () => void
  onConfirm: (cropped: Blob) => void
}

/** Lets the user move and zoom the photo inside a square before it is uploaded. */
export function AvatarCropDialog({ file, onCancel, onConfirm }: AvatarCropDialogProps) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const drag = useRef<{ x: number; y: number } | null>(null)
  const [bitmap, setBitmap] = useState<ImageBitmap | null>(null)
  const [zoom, setZoom] = useState(MIN_ZOOM)
  const [center, setCenter] = useState({ x: 0, y: 0 })
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!file) return
    let cancelled = false
    let loaded: ImageBitmap | null = null
    loadAvatarBitmap(file)
      .then((next) => {
        if (cancelled) return next.close()
        loaded = next
        setBitmap(next)
        setCenter({ x: next.width / 2, y: next.height / 2 })
        setZoom(MIN_ZOOM)
        setError(null)
      })
      .catch(() => !cancelled && setError('Impossible de lire cette photo.'))
    return () => {
      cancelled = true
      loaded?.close()
      setBitmap(null)
    }
  }, [file])

  const region = bitmap
    ? resolveCropRegion({ imageWidth: bitmap.width, imageHeight: bitmap.height, zoom, centerX: center.x, centerY: center.y })
    : null

  useEffect(() => {
    if (bitmap && region && canvas.current) drawCropRegion(bitmap, region, canvas.current, PREVIEW_PX * 2)
  }, [bitmap, region])

  const move = (event: React.PointerEvent) => {
    if (!drag.current || !region) return
    const scale = region.side / PREVIEW_PX
    const dx = (event.clientX - drag.current.x) * scale
    const dy = (event.clientY - drag.current.y) * scale
    drag.current = { x: event.clientX, y: event.clientY }
    // The centre follows the finger the other way round: dragging right shows what is on the left.
    setCenter((previous) => ({ x: previous.x - dx, y: previous.y - dy }))
  }

  const confirm = async () => {
    if (!bitmap || !region) return
    setSaving(true)
    try {
      onConfirm(await cropAvatar(bitmap, region))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Impossible de préparer la photo.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={file !== null} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Recadre ta photo</DialogTitle>
          <DialogDescription>Glisse la photo pour la placer, zoome avec le curseur.</DialogDescription>
        </DialogHeader>

        <div className="mx-auto overflow-hidden rounded-full border border-border bg-muted" style={{ width: PREVIEW_PX, height: PREVIEW_PX }}>
          <canvas
            ref={canvas}
            aria-label="Aperçu du recadrage"
            className="size-full cursor-grab touch-none active:cursor-grabbing"
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId)
              drag.current = { x: event.clientX, y: event.clientY }
            }}
            onPointerMove={move}
            onPointerUp={() => (drag.current = null)}
            onPointerCancel={() => (drag.current = null)}
          />
        </div>

        <label className="flex items-center gap-3 text-sm text-muted-foreground">
          Zoom
          <input
            type="range"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={0.05}
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
            className="h-11 w-full accent-primary"
          />
        </label>

        {error ? (
          <p role="alert" className="text-xs text-destructive">
            {error}
          </p>
        ) : null}

        <DialogFooter>
          <Button type="button" variant="outline" size="cta" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="button" size="cta" onClick={confirm} disabled={!bitmap || saving}>
            Valider
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
