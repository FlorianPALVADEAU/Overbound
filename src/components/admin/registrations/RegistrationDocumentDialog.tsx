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
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
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
  onStatusChange?: () => void
}

type DocumentStatus = 'pending' | 'approved' | 'rejected'

const statusMeta = (status: DocumentStatus) => {
  switch (status) {
    case 'approved':
      return { label: 'Validé', variant: 'default' as const }
    case 'rejected':
      return { label: 'Rejeté', variant: 'destructive' as const }
    default:
      return { label: 'En attente', variant: 'secondary' as const }
  }
}

export function RegistrationDocumentDialog({
  registration,
  open,
  onOpenChange,
  onStatusChange,
}: RegistrationDocumentDialogProps) {
  const [loading, setLoading] = useState(false)
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [documents, setDocuments] = useState<Array<{
    id: string
    document_type: string
    document_filename: string
    document_size: number | null
    status?: DocumentStatus
    rejection_reason?: string | null
  }>>([])
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')

  useEffect(() => {
    if (!open || !registration?.id) {
      setSignedUrl(null)
      setErrorMessage(null)
      setLoading(false)
      setDocuments([])
      setSelectedDocumentId(null)
      setActionMessage(null)
      setRejectionReason('')
      return
    }

    let isCancelled = false

    const fetchDocuments = async () => {
      setLoading(true)
      setErrorMessage(null)
      try {
        const response = await fetch(`/api/admin/registrations/${registration.id}/documents`)
        if (!response.ok) throw new Error('Impossible de récupérer les documents')
        const payload = await response.json()
        if (!isCancelled) {
          setDocuments(payload.documents ?? [])
          const firstDocId = payload.documents?.[0]?.id ?? null
          setSelectedDocumentId(firstDocId)
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

    fetchDocuments()

    return () => {
      isCancelled = true
    }
  }, [open, registration?.id])

  useEffect(() => {
    if (!open || !registration?.id) {
      return
    }

    let isCancelled = false

    const fetchSignedUrl = async () => {
      setLoading(true)
      setErrorMessage(null)
      try {
        const query = selectedDocumentId ? `?document_id=${selectedDocumentId}` : ''
        const response = await fetch(`/api/admin/registrations/${registration.id}/document${query}`)
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
  }, [open, registration?.id, selectedDocumentId])

  const selectedDocument = documents.find((doc) => doc.id === selectedDocumentId) ?? null
  const selectedStatus = (selectedDocument?.status ?? 'pending') as DocumentStatus
  const selectedStatusMeta = statusMeta(selectedStatus)
  const selectedIsLegacy = selectedDocument?.id === 'legacy'
  const selectedFilename = selectedDocument?.document_filename?.toLowerCase() ?? ''
  const isImage = ['.png', '.jpg', '.jpeg', '.webp', '.gif'].some((ext) =>
    selectedFilename.endsWith(ext),
  )

  useEffect(() => {
    if (!selectedDocument) {
      setRejectionReason('')
      return
    }
    setRejectionReason(selectedDocument.rejection_reason ?? '')
  }, [selectedDocumentId, documents])

  useEffect(() => {
    setActionMessage(null)
  }, [selectedDocumentId])

  const updateDocumentStatus = async (nextStatus: DocumentStatus) => {
    if (!registration?.id || !selectedDocumentId || selectedIsLegacy) return
    setActionLoading(true)
    setActionMessage(null)

    try {
      const response = await fetch(`/api/admin/registrations/${registration.id}/documents/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_id: selectedDocumentId,
          status: nextStatus,
          reason: nextStatus === 'rejected' ? rejectionReason : undefined,
        }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.error || 'Impossible de mettre à jour le statut')
      }

      const payload = await response.json()

      setDocuments((prev) =>
        prev.map((doc) =>
          doc.id === selectedDocumentId
            ? {
                ...doc,
                status: payload.document?.status ?? nextStatus,
                rejection_reason: payload.document?.rejection_reason ?? null,
              }
            : doc,
        ),
      )
      if (nextStatus !== 'rejected') {
        setRejectionReason('')
      }
      setActionMessage({
        type: 'success',
        text:
          nextStatus === 'approved'
            ? 'Document validé.'
            : nextStatus === 'rejected'
              ? 'Document rejeté.'
              : 'Statut remis en attente.',
      })
      onStatusChange?.()
    } catch (error) {
      setActionMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Erreur lors de la mise à jour',
      })
    } finally {
      setActionLoading(false)
    }
  }

  if (!registration) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!w-[90vw] !max-w-none sm:!max-w-none !h-[86vh] !max-h-[86vh]">
        <DialogHeader>
          <DialogTitle>Document de {registration.email}</DialogTitle>
          <DialogDescription>
            {documents.length > 0
              ? `${documents.length} document${documents.length > 1 ? 's' : ''} reçu${documents.length > 1 ? 's' : ''}`
              : registration.document_filename
                ? `${registration.document_filename} • ${formatFileSize(registration.document_size || undefined)}`
                : 'Aucun document disponible'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden space-y-4">
          {documents.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {documents.map((doc) => (
                <Button
                  key={doc.id}
                  size="sm"
                  variant={selectedDocumentId === doc.id ? 'default' : 'outline'}
                  onClick={() => setSelectedDocumentId(doc.id)}
                >
                  <span className="flex items-center gap-2">
                    {doc.document_filename}
                    {doc.status ? (
                      <Badge variant={statusMeta(doc.status).variant} className="text-[10px]">
                        {statusMeta(doc.status).label}
                      </Badge>
                    ) : null}
                  </span>
                </Button>
              ))}
            </div>
          ) : null}
          {selectedDocument ? (
            <div className="flex flex-wrap items-center gap-2 rounded-md border border-border/60 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{selectedDocument.document_filename}</span>
              <Badge variant={selectedStatusMeta.variant}>{selectedStatusMeta.label}</Badge>
              <span className="text-[11px] text-muted-foreground">
                {selectedDocument.document_type}
              </span>
            </div>
          ) : null}
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
            <div className="h-[70vh] w-full rounded border bg-black/5">
              {isImage ? (
                <img
                  src={signedUrl}
                  alt={selectedDocument?.document_filename ?? 'Document'}
                  className="h-full w-full object-contain"
                />
              ) : (
                <iframe
                  src={signedUrl}
                  className="h-full w-full"
                  title="Document de l'inscription"
                />
              )}
            </div>
          ) : (
            <div className="flex h-[200px] items-center justify-center rounded border border-dashed border-muted-foreground/40 bg-muted/20 p-6 text-center text-sm text-muted-foreground">
              Aucun document disponible pour cette inscription.
            </div>
          )}
        </div>

        <DialogFooter className="flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-full flex-1 flex-col gap-3 text-left sm:max-w-[380px]">
            {selectedDocument ? (
              <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">
                    {selectedDocument.document_filename}
                  </span>
                  <Badge variant={selectedStatusMeta.variant}>{selectedStatusMeta.label}</Badge>
                </div>
                {selectedDocument.rejection_reason ? (
                  <p className="mt-2 text-destructive">
                    Raison : {selectedDocument.rejection_reason}
                  </p>
                ) : null}
              </div>
            ) : null}

            {selectedStatus !== 'approved' ? (
              <div className="space-y-2">
                <label className="text-xs font-medium text-foreground">
                  Raison du rejet (optionnelle)
                </label>
                <Textarea
                  value={rejectionReason}
                  onChange={(event) => setRejectionReason(event.target.value)}
                  placeholder="Indiquez la raison si besoin..."
                  rows={2}
                  className="text-xs"
                />
              </div>
            ) : null}

            {actionMessage ? (
              <p className={actionMessage.type === 'error' ? 'text-xs text-destructive' : 'text-xs text-emerald-600'}>
                {actionMessage.text}
              </p>
            ) : null}
            {selectedIsLegacy ? (
              <p className="text-xs text-muted-foreground">
                Document legacy : statut non modifiable.
              </p>
            ) : null}
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
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
            {selectedDocument ? (
              <>
                <Button
                  variant="destructive"
                  disabled={actionLoading || selectedIsLegacy}
                  onClick={() => updateDocumentStatus('rejected')}
                >
                  Rejeter
                </Button>
                <Button
                  disabled={actionLoading || selectedIsLegacy}
                  onClick={() => updateDocumentStatus('approved')}
                >
                  Approuver
                </Button>
              </>
            ) : null}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
