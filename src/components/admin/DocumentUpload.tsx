/* eslint-disable react/no-unescaped-entities */
'use client'
import React, { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertTriangle,
  Download
} from 'lucide-react'

interface DocumentUploadProps {
  registrationId: string
  currentDocument?: {
    url: string
    filename: string
    size: number
  }
  approvalStatus: 'pending' | 'approved' | 'rejected'
  rejectionReason?: string
  onUploadComplete?: (document: any) => void
}

export function DocumentUpload({ 
  registrationId, 
  currentDocument, 
  approvalStatus, 
  rejectionReason,
  onUploadComplete 
}: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (file: File) => {
    if (!file) return

    // Validation côté client
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      setMessage({ type: 'error', text: 'Le fichier est trop volumineux (maximum 10MB)' })
      return
    }

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
    if (!allowedTypes.includes(file.type)) {
      setMessage({ type: 'error', text: 'Type de fichier non autorisé. Utilisez PDF, JPG ou PNG uniquement.' })
      return
    }

    uploadFile(file)
  }

  const uploadFile = async (file: File) => {
    setUploading(true)
    setUploadProgress(0)
    setMessage(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('registration_id', registrationId)

      // Simuler la progression (remplacer par une vraie progression si possible)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90))
      }, 100)

      const response = await fetch('/api/upload/document', {
        method: 'POST',
        body: formData
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de l\'upload')
      }

      const result = await response.json()
      
      setMessage({ 
        type: 'success', 
        text: 'Document uploadé avec succès ! Il sera examiné par un administrateur.' 
      })

      onUploadComplete?.(result)

    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Erreur lors de l\'upload' 
      })
      setUploadProgress(0)
    } finally {
      setUploading(false)
      setTimeout(() => setUploadProgress(0), 2000)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const formatFileSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const getStatusIcon = () => {
    switch (approvalStatus) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-600" />
      case 'pending':
        return <Clock className="h-5 w-5 text-orange-600" />
      default:
        return <FileText className="h-5 w-5 text-muted-foreground" />
    }
  }

  const getStatusLabel = () => {
    switch (approvalStatus) {
      case 'approved': return 'Approuvé'
      case 'rejected': return 'Rejeté'
      case 'pending': return 'En attente de validation'
      default: return 'Aucun document'
    }
  }

  const getStatusColor = () => {
    switch (approvalStatus) {
      case 'approved': return 'default'
      case 'rejected': return 'destructive'
      case 'pending': return 'secondary'
      default: return 'outline'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Document justificatif
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Statut actuel */}
        {currentDocument && (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon()}
                <div>
                  <p className="font-medium">{currentDocument.filename}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(currentDocument.size)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={getStatusColor()}>
                  {getStatusLabel()}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <a 
                    href={currentDocument.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>

            {/* Raison de rejet */}
            {approvalStatus === 'rejected' && rejectionReason && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Raison du rejet :</strong> {rejectionReason}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Zone d'upload */}
        {(!currentDocument || approvalStatus === 'rejected') && (
          <div className="space-y-4">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragOver
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-primary/50'
              } ${uploading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => !uploading && fileInputRef.current?.click()}
            >
              <div className="flex flex-col items-center gap-4">
                <div className="p-3 bg-muted rounded-full">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                </div>
                
                <div className="space-y-2">
                  <p className="text-lg font-medium">
                    {currentDocument ? 'Remplacer le document' : 'Uploader un document'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Glissez-déposez votre fichier ici ou cliquez pour parcourir
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PDF, JPG, PNG • Maximum 10MB
                  </p>
                </div>

                {!uploading && (
                  <Button variant="outline" size="sm">
                    Choisir un fichier
                  </Button>
                )}
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileSelect(file)
              }}
              className="hidden"
            />
          </div>
        )}

        {/* Progression d'upload */}
        {uploading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Upload en cours...</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
          </div>
        )}

        {/* Messages */}
        {message && (
          <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
            {message.type === 'error' ? (
              <AlertTriangle className="h-4 w-4" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        {/* Informations sur les documents requis */}
        {!currentDocument && (
          <div className="p-4 bg-muted/30 rounded-lg">
            <h4 className="font-medium mb-2">Documents acceptés :</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Certificat médical de non contre-indication au sport</li>
              <li>• Licence sportive en cours de validité</li>
              <li>• Attestation d'assurance responsabilité civile</li>
            </ul>
            <p className="text-xs text-muted-foreground mt-2">
              Votre inscription sera validée après vérification de votre document par notre équipe.
            </p>
          </div>
        )}

        {/* Statut d'approbation en attente */}
        {currentDocument && approvalStatus === 'pending' && (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              Votre document est en cours de vérification. Vous recevrez une notification par email 
              une fois la validation effectuée.
            </AlertDescription>
          </Alert>
        )}

        {/* Document approuvé */}
        {currentDocument && approvalStatus === 'approved' && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Parfait !</strong> Votre document a été approuvé. 
              Votre inscription est confirmée pour l'événement.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}