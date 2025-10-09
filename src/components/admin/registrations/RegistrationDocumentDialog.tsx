'use client'

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { AdminRegistration } from '@/types/Registration'
import { Download, Loader2 } from 'lucide-react'

function formatFileSize(bytes?: number) {
  if (!bytes) return ''
  const units = ['B', 'KB', 'MB', 'GB']
  const index = Math.floor(Math.log(bytes) / Math.log(1024))
  const value = Math.round((bytes / Math.pow(1024, index)) * 100) / 100
  return `${value} ${units[index]}`
}

interface RegistrationDocumentDialogProps {
  registration: AdminRegistration | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RegistrationDocumentDialog({ registration, open, onOpenChange }: RegistrationDocumentDialogProps) {
  const [loading, setLoading] = useState(false)
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !registration?.id || !registration.document_url) {
      setSignedUrl(null)
      setErrorMessage(null)
      setLoading(false)
      return
    }

    let isCancelled = false

    const fetchSignedUrl = async () => {
      setLoading(true)
      setErrorMessage(null)
      try {
        const response = await fetch(`/api/admin/registrations/${registration.id}/document`)
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}))
          throw new Error(payload.error || 'Impossible de récupérer le document')
        }
        const payload = await response.json()
        if (!isCancelled) {
          setSignedUrl(payload.url)
        }
      } catch (error) {
        if (!isCancelled) {
          setErrorMessage(
            error instanceof Error ? error.message : 'Impossible de récupérer le document',
          )
          setSignedUrl(null)
        }
      } finally {
        if (!isCancelled) {
          setLoading(false)
        }
      }
    }

    fetchSignedUrl()

    return () => {
      isCancelled = true
    }
  }, [open, registration?.id, registration?.document_url])

  if (!registration) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Document de {registration.email}</DialogTitle>
          <DialogDescription>
            {registration.document_filename} • {formatFileSize(registration.document_size || undefined)}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex h-[400px] items-center justify-center text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Chargement du document…
            </div>
          ) : errorMessage ? (
            <div className="flex h-[200px] items-center justify-center rounded border border-dashed border-destructive/40 bg-destructive/5 p-6 text-center text-sm text-destructive">
              {errorMessage}
            </div>
          ) : signedUrl ? (
            <iframe
              src={signedUrl}
              className="h-[600px] w-full rounded border"
              title="Document de l'inscription"
            />
          ) : (
            <div className="flex h-[200px] items-center justify-center rounded border border-dashed border-muted-foreground/40 bg-muted/20 p-6 text-center text-sm text-muted-foreground">
              Aucun document disponible pour cette inscription.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
          {signedUrl && !errorMessage ? (
            <Button asChild>
              <a href={signedUrl} target="_blank" rel="noopener noreferrer">
                <Download className="mr-2 h-4 w-4" />
                Télécharger
              </a>
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
