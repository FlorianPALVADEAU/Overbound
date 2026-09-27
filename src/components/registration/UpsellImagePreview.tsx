'use client'

import { ChevronLeft, ChevronRight, ImageOff, Maximize2, X } from 'lucide-react'
import { useState } from 'react'
import { Dialog, DialogClose, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface UpsellImagePreviewProps {
  src: string | null | undefined
  sources?: Array<string | null | undefined | { src?: string | null; alt?: string | null }>
  alt: string
  className?: string
  imageClassName?: string
}

type PreviewImage = { src: string; alt: string }

export function UpsellImagePreview({ src, sources = [], alt, className, imageClassName }: UpsellImagePreviewProps) {
  const imageCandidates: Array<{ src: string | null | undefined; alt?: string | null }> = [
    { src, alt },
    ...sources.map((source) =>
      typeof source === 'string' ? { src: source, alt } : { src: source?.src, alt: source?.alt ?? alt },
    ),
  ]
  const images = Array.from(
    new Map(
      imageCandidates.reduce<Array<[string, PreviewImage]>>((result, image) => {
        if (image.src) result.push([image.src, { src: image.src, alt: image.alt || alt }])
        return result
      }, []),
    ).values(),
  )
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [open, setOpen] = useState(false)
  const [failedSources, setFailedSources] = useState<Set<string>>(() => new Set())
  const selectedImage = images[selectedIndex] ?? images[0]
  const selectedSource = selectedImage?.src
  if (!selectedSource) return null

  const selectedAlt = selectedImage.alt || alt
  const isFailed = failedSources.has(selectedSource)
  const markFailed = (source: string) =>
    setFailedSources((failed) => {
      if (failed.has(source)) return failed
      const next = new Set(failed)
      next.add(source)
      return next
    })

  const changeImage = (direction: -1 | 1) => {
    setSelectedIndex((index) => Math.min(images.length - 1, Math.max(0, index + direction)))
  }

  const fallback = <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground" aria-label="Image indisponible"><ImageOff className="h-6 w-6" aria-hidden="true" /></div>

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className={cn('group relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border p-0', className)}
          aria-label={`Agrandir l'image de ${alt}`}
        >
          {isFailed ? fallback : <img src={selectedSource} alt={selectedAlt} onError={() => markFailed(selectedSource)} className={cn('h-full w-full object-cover', imageClassName)} />}
          <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-white opacity-0 transition group-hover:bg-black/35 group-hover:opacity-100 group-focus-visible:bg-black/35 group-focus-visible:opacity-100">
            <Maximize2 className="h-5 w-5" aria-hidden="true" />
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault()
            setOpen(false)
          } else if (images.length > 1 && event.key === 'ArrowLeft') {
            event.preventDefault()
            changeImage(-1)
          } else if (images.length > 1 && event.key === 'ArrowRight') {
            event.preventDefault()
            changeImage(1)
          }
        }}
        className="max-w-4xl border-0 bg-transparent p-2 shadow-none sm:p-4"
      >
        <DialogTitle className="sr-only">{alt}</DialogTitle>
        <div className="space-y-3">
          <div className="relative">
            {isFailed ? (
              <div className="flex h-[40svh] max-h-[72svh] w-full items-center justify-center rounded-lg bg-muted text-muted-foreground sm:h-[60vh] sm:max-h-[78vh]" aria-label="Image indisponible">
                <ImageOff className="h-10 w-10" aria-hidden="true" />
              </div>
            ) : (
              <img
                src={selectedSource}
                alt={selectedAlt}
                onError={() => markFailed(selectedSource)}
                className="max-h-[72svh] w-full rounded-lg object-contain sm:max-h-[78vh]"
              />
            )}
            <DialogClose asChild>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="absolute top-2 right-2 h-11 w-11 rounded-full bg-background/95 text-foreground shadow-md hover:bg-background"
                aria-label="Fermer l'aperçu"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </Button>
            </DialogClose>
            {images.length > 1 ? <>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="absolute top-1/2 left-2 h-12 w-12 -translate-y-1/2 rounded-full bg-background/95 text-foreground shadow-md hover:bg-background disabled:opacity-40"
                onClick={() => setSelectedIndex((index) => Math.max(0, index - 1))}
                disabled={selectedIndex === 0}
                aria-label="Image précédente"
              >
                <ChevronLeft className="h-6 w-6" aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="absolute top-1/2 right-2 h-12 w-12 -translate-y-1/2 rounded-full bg-background/95 text-foreground shadow-md hover:bg-background disabled:opacity-40"
                onClick={() => setSelectedIndex((index) => Math.min(images.length - 1, index + 1))}
                disabled={selectedIndex === images.length - 1}
                aria-label="Image suivante"
              >
                <ChevronRight className="h-6 w-6" aria-hidden="true" />
              </Button>
            </> : null}
          </div>
          {images.length > 1 ? <div className="flex justify-center gap-2" aria-label="Autres images">
            {images.map((image, index) => <Button key={image.src} type="button" variant={index === selectedIndex ? 'secondary' : 'outline'} size="sm" onClick={() => setSelectedIndex(index)} aria-label={`Afficher l'image ${index + 1}`}>{index + 1}</Button>)}
          </div> : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
