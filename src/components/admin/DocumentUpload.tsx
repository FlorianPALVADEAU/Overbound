'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  Upload,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  FileText,
  Download,
} from 'lucide-react'

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024
const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png']
const ALLOWED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png']
const ACCEPT_ATTRIBUTE = '.pdf,.jpg,.jpeg,.png'

type DocumentStatus = 'pending' | 'approved' | 'rejected'

export interface ExistingDocument {
  id: string
  url: string
  filename: string
  size: number
  documentType: string
  status?: DocumentStatus
  rejectionReason?: string | null
}

interface DocumentUploadProps {
  registrationId: string
  existingDocuments?: ExistingDocument[]
  status?: DocumentStatus
  rejectionReason?: string | null
  requiredTypes?: string[]
  onUploaded?: () => void
}

const formatFileSize = (bytes: number) => {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / Math.pow(1024, index)
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`
}

const statusBadge = (status: DocumentStatus, rejectionReason?: string | null) => {
  switch (status) {
    case 'approved':
      return {
        label: 'Document validé',
        variant: 'default' as const,
        icon: <CheckCircle2 className="h-4 w-4" />,
        description: 'Ton document a été approuvé. Aucun autre action n’est nécessaire.',
      }
    case 'rejected':
      return {
        label: 'Document rejeté',
        variant: 'destructive' as const,
        icon: <XCircle className="h-4 w-4" />,
        description: rejectionReason
          ? `Raison du rejet : ${rejectionReason}`
          : 'Ton document a été refusé. Dépose un nouveau fichier conforme.',
      }
    default:
      return {
        label: 'En attente de validation',
        variant: 'secondary' as const,
        icon: <Clock className="h-4 w-4" />,
        description:
          'Ton document a bien été reçu et sera vérifié par nos équipes sous peu.',
      }
  }
}

export function DocumentUpload({
  registrationId,
  existingDocuments = [],
  status = 'pending',
  rejectionReason,
  requiredTypes = [],
  onUploaded,
}: DocumentUploadProps) {
  const [documents, setDocuments] = useState<ExistingDocument[]>(existingDocuments)
  const [documentStatus, setDocumentStatus] = useState<DocumentStatus>(status)
  const [messageMap, setMessageMap] = useState<Record<string, { type: 'success' | 'error'; text: string } | null>>({})
  const [uploadingMap, setUploadingMap] = useState<Record<string, boolean>>({})
  const [progressMap, setProgressMap] = useState<Record<string, number>>({})
  const [dragOverType, setDragOverType] = useState<string | null>(null)
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  useEffect(() => {
    setDocuments(existingDocuments)
  }, [existingDocuments])

  useEffect(() => {
    setDocumentStatus(status)
  }, [status])

  const sanitizedRequiredTypes = requiredTypes.filter((value) => value && value.trim())

  const formatRequiredType = (value: string) => {
    const lookup: Record<string, string> = {
      pps_certificate: 'Certificat PPS',
      pps_certificate_2025: 'Certificat PPS 2026',
      sports_license: 'Licence sportive',
      insurance_certificate: "Attestation d'assurance",
      parental_authorization: 'Autorisation parentale',
      id_document: 'Pièce d’identité',
    }

    return lookup[value] || value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
  }

  const allowedTypesText =
    sanitizedRequiredTypes.length > 0
      ? sanitizedRequiredTypes.map(formatRequiredType).join(', ')
      : 'Certificat PPS, licence sportive ou attestation d’assurance'

  const requiredDocumentTypes = Array.from(
    new Set(sanitizedRequiredTypes.length > 0 ? sanitizedRequiredTypes : ['document']),
  )

  const documentsByType = new Map<string, ExistingDocument>()
  for (const doc of documents) {
    documentsByType.set(doc.documentType, doc)
  }

  const setMessageFor = (docType: string, message: { type: 'success' | 'error'; text: string } | null) => {
    setMessageMap((prev) => ({ ...prev, [docType]: message }))
  }

  const setUploadingFor = (docType: string, uploading: boolean) => {
    setUploadingMap((prev) => ({ ...prev, [docType]: uploading }))
  }

  const setProgressFor = (docType: string, value: number) => {
    setProgressMap((prev) => ({ ...prev, [docType]: value }))
  }

  const openDocument = async (docType: string, documentId: string) => {
    try {
      const response = await fetch(
        `/api/account/registrations/${registrationId}/document-url?document_id=${documentId}`,
      )
      if (!response.ok) throw new Error('Impossible de récupérer le document')
      const { url } = await response.json()
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (error) {
      setMessageFor(docType, {
        type: 'error',
        text: "Impossible d'ouvrir le document",
      })
    }
  }

  const beginUpload = async (file: File, docType: string) => {
    setUploadingFor(docType, true)
    setProgressFor(docType, 0)
    setMessageFor(docType, null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('registration_id', registrationId)
      formData.append('document_type', docType)

      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 60_000)

      let localProgress = 0
      const tick = setInterval(() => {
        localProgress = Math.min(90, localProgress + 8)
        setProgressFor(docType, localProgress)
      }, 120)

      const response = await fetch('/api/upload/document', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      })

      clearTimeout(timeout)
      clearInterval(tick)
      setProgressFor(docType, 100)

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.error || "Impossible d'envoyer le document")
      }

      const payload = await response.json()
      setDocuments((prev) => {
        const next = prev.filter((doc) => doc.documentType !== docType)
        return [
          {
            id: payload.document_id ?? `${docType}-${Date.now()}`,
            url: payload.document_url,
            filename: payload.filename,
            size: payload.size,
            documentType: payload.document_type ?? docType,
            status: 'pending',
          },
          ...next,
        ]
      })
      setDocumentStatus('pending')
      setMessageFor(docType, {
        type: 'success',
        text: 'Document envoyé. Nous te prévenons dès qu’il est validé.',
      })
      onUploaded?.()
    } catch (error) {
      console.error('[DocumentUpload] upload error', error)
      setMessageFor(docType, {
        type: 'error',
        text:
          error instanceof Error && error.name !== 'AbortError'
            ? error.message
            : "L'envoi a échoué. Merci de réessayer.",
      })
      setProgressFor(docType, 0)
    } finally {
      setUploadingFor(docType, false)
      setTimeout(() => setProgressFor(docType, 0), 1500)
    }
  }

  const validateFile = (file: File, docType: string) => {
    if (!file) return

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setMessageFor(docType, {
        type: 'error',
        text: 'Le fichier est trop volumineux (2 Mo maximum).',
      })
      return
    }

    const mimeAllowed = ALLOWED_MIME_TYPES.includes(file.type)
    const extension = file.name.split('.').pop()?.toLowerCase()
    const extensionAllowed = extension ? ALLOWED_EXTENSIONS.includes(extension) : false

    if (!mimeAllowed && !extensionAllowed) {
      setMessageFor(docType, {
        type: 'error',
        text: 'Format non supporté. Utilise un PDF, JPG, JPEG ou PNG.',
      })
      return
    }

    beginUpload(file, docType)
  }

  const onFileInputChange = (event: React.ChangeEvent<HTMLInputElement>, docType: string) => {
    const file = event.target.files?.[0]
    if (file) {
      validateFile(file, docType)
    }
    event.target.value = ''
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>, docType: string) => {
    event.preventDefault()
    setDragOverType(null)
    const file = event.dataTransfer.files?.[0]
    if (file) {
      validateFile(file, docType)
    }
  }

  const statusMeta = statusBadge(documentStatus, rejectionReason)
  const canUpload = documentStatus !== 'approved'

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-primary/10 p-2 text-primary">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <Badge variant={statusMeta.variant} className="inline-flex items-center gap-1">
              {statusMeta.icon}
              {statusMeta.label}
            </Badge>
            <p className="mt-2 text-xs text-muted-foreground">{statusMeta.description}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {requiredDocumentTypes.map((docType) => {
          const doc = documentsByType.get(docType)
          const uploading = uploadingMap[docType] ?? false
          const progress = progressMap[docType] ?? 0
          const message = messageMap[docType]
          const isDragOver = dragOverType === docType
          const docStatus = doc?.status ?? documentStatus
          const docStatusMeta = statusBadge(docStatus, doc?.rejectionReason ?? rejectionReason)

          return (
            <div key={docType} className="rounded-2xl border border-border bg-card/80 p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">
                    {formatRequiredType(docType)}
                  </p>
                  {doc ? (
                    <p className="text-xs text-muted-foreground">
                      {doc.filename} • {formatFileSize(doc.size)}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">Aucun document déposé.</p>
                  )}
                  <Badge variant={docStatusMeta.variant} className="mt-2 inline-flex items-center gap-1">
                    {docStatusMeta.icon}
                    {docStatusMeta.label}
                  </Badge>
                </div>
                {doc ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0"
                    onClick={() => openDocument(docType, doc.id)}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Ouvrir
                  </Button>
                ) : null}
              </div>

              {canUpload ? (
                <div className="space-y-3">
                  <div
                    className={`group relative flex flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/30 px-6 py-8 text-center transition-colors ${
                      isDragOver
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/40 hover:bg-muted/40'
                    } ${uploading ? 'pointer-events-none opacity-60' : 'cursor-pointer'}`}
                    onDrop={(event) => handleDrop(event, docType)}
                    onDragOver={(event) => {
                      event.preventDefault()
                      setDragOverType(docType)
                    }}
                    onDragLeave={(event) => {
                      event.preventDefault()
                      setDragOverType(null)
                    }}
                    onClick={() => !uploading && fileInputRefs.current[docType]?.click()}
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="rounded-full border border-dashed border-muted-foreground/40 bg-background p-3 text-muted-foreground transition-colors group-hover:border-primary/50 group-hover:text-primary">
                        <Upload className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold">
                          {doc ? 'Remplacer le document' : 'Déposer un document'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Glisse ton fichier ici ou clique pour parcourir ton ordinateur.
                        </p>
                        <p className="text-[11px] font-medium text-muted-foreground">
                          Formats acceptés : PDF, JPG, JPEG, PNG — 2 Mo max.
                        </p>
                      </div>
                      <Button variant="outline" size="sm" className="mt-1">
                        Choisir un fichier
                      </Button>
                    </div>
                  </div>

                  <input
                    ref={(node) => {
                      fileInputRefs.current[docType] = node
                    }}
                    type="file"
                    accept={ACCEPT_ATTRIBUTE}
                    onChange={(event) => onFileInputChange(event, docType)}
                    className="hidden"
                  />
                </div>
              ) : null}

              {uploading ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Envoi du document…</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              ) : null}

              {message ? (
                <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
                  {message.type === 'error' ? (
                    <AlertTriangle className="h-4 w-4" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  <AlertDescription>{message.text}</AlertDescription>
                </Alert>
              ) : null}
            </div>
          )
        })}
      </div>

      <div className="rounded-xl border border-border/70 bg-muted/20 p-4 text-xs text-muted-foreground">
        <p className="font-medium text-foreground">Pièces attendues</p>
        <p className="mt-1">{allowedTypesText}</p>
        {sanitizedRequiredTypes.length > 0 ? (
          <ul className="mt-3 space-y-1 text-muted-foreground">
            {sanitizedRequiredTypes.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary/70" />
                <span>{formatRequiredType(item)}</span>
              </li>
            ))}
          </ul>
        ) : null}
        <p className="mt-3">
          Assure-toi que le document est lisible, signé si nécessaire, et qu’il correspond bien au
          participant renseigné lors de ton inscription.
        </p>
      </div>
    </div>
  )
}
