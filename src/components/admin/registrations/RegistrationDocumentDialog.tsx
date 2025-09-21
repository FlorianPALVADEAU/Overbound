'use client'

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
import { Download } from 'lucide-react'

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
          {registration.document_url && (
            <iframe
              src={registration.document_url}
              className="w-full h-[600px] border rounded"
              title="Document de l'inscription"
            />
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
          {registration.document_url && (
            <Button asChild>
              <a
                href={registration.document_url}
                download={registration.document_filename || undefined}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Download className="h-4 w-4 mr-2" />
                Télécharger
              </a>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
