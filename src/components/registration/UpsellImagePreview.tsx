'use client'

import { Maximize2 } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface UpsellImagePreviewProps {
  src: string | null | undefined
  alt: string
  className?: string
  imageClassName?: string
}

export function UpsellImagePreview({ src, alt, className, imageClassName }: UpsellImagePreviewProps) {
  if (!src) return null

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className={cn('group relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border p-0', className)}
          aria-label={`Agrandir l'image de ${alt}`}
        >
          <img src={src} alt={alt} className={cn('h-full w-full object-cover', imageClassName)} />
          <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-white opacity-0 transition group-hover:bg-black/35 group-hover:opacity-100 group-focus-visible:bg-black/35 group-focus-visible:opacity-100">
            <Maximize2 className="h-5 w-5" aria-hidden="true" />
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl border-0 bg-transparent p-2 shadow-none sm:p-4">
        <DialogTitle className="sr-only">{alt}</DialogTitle>
        <img src={src} alt={alt} className="max-h-[80vh] w-full rounded-lg object-contain" />
      </DialogContent>
    </Dialog>
  )
}
