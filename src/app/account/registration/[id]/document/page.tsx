'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { FileText, Calendar, MapPin, Trophy, ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DocumentUpload } from '@/components/admin/DocumentUpload'
import { useSession } from '@/app/api/session/sessionQueries'
import { useRegistrationDocument } from '@/app/api/account/registrations/[id]/document-data/documentDataQueries'

const getDifficultyColor = (difficulty: number) => {
  if (difficulty <= 3) return 'bg-green-100 text-green-800'
  if (difficulty <= 6) return 'bg-yellow-100 text-yellow-800'
  return 'bg-red-100 text-red-800'
}

const getApprovalStatusColor = (status: string) => {
  switch (status) {
    case 'approved':
      return 'default'
    case 'pending':
      return 'secondary'
    case 'rejected':
      return 'destructive'
    default:
      return 'outline'
  }
}

const getApprovalStatusLabel = (status: string) => {
  switch (status) {
    case 'approved':
      return 'Approuvé'
    case 'pending':
      return 'En attente'
    case 'rejected':
      return 'Rejeté'
    default:
      return 'Non validé'
  }
}

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
}

export default function RegistrationDocumentPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { data: session, isLoading: sessionLoading } = useSession()
  const { data, isLoading, error, refetch } = useRegistrationDocument(params.id, {
    enabled: Boolean(session?.user),
  })

  useEffect(() => {
    if (!sessionLoading && !session?.user) {
      router.replace('/auth/login')
    }
  }, [session?.user, sessionLoading, router])

  if (sessionLoading || (session && !session.user)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/20">
        <div className="text-sm text-muted-foreground">Chargement…</div>
      </main>
    )
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/20">
        <div className="text-sm text-muted-foreground">Chargement de l'inscription…</div>
      </main>
    )
  }

  if (error || !data?.registration) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto max-w-lg px-6 py-12">
          <Card>
            <CardHeader>
              <CardTitle>Inscription introuvable</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>{error?.message || "Cette inscription n'existe pas."}</p>
              <Button onClick={() => refetch()}>Réessayer</Button>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  const registration = data.registration

  if (!registration.ticket.requires_document) {
    router.replace(`/account/ticket/${registration.id}`)
    return null
  }

  const currentDocument = registration.document_url
    ? {
        url: registration.document_url,
        filename: registration.document_filename || 'Document',
        size: registration.document_size || 0,
      }
    : undefined

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto max-w-4xl p-6">
        <div className="mb-6">
          <Link href="/account">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour à mes inscriptions
            </Button>
          </Link>
        </div>

        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-primary/10 p-3">
              <FileText className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="mb-2 text-3xl font-bold">Document justificatif</h1>
          <p className="text-sm text-muted-foreground">
            Téléchargez votre document pour valider votre inscription
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Votre inscription
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <h3 className="font-semibold">{registration.event.title}</h3>
                  {registration.event.subtitle ? (
                    <p className="text-muted-foreground">{registration.event.subtitle}</p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {new Date(registration.event.date).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{registration.event.location}</span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="mb-2 font-medium">Format sélectionné</h4>
                  <p>{registration.ticket.name}</p>
                  {registration.ticket.race ? (
                    <Badge
                      variant={getDifficultyColor(registration.ticket.race.difficulty) as any}
                      className="mt-2"
                    >
                      {registration.ticket.race.name} - {registration.ticket.race.distance_km} km
                    </Badge>
                  ) : null}
                </div>

                <div className="rounded-md border border-dashed border-muted/50 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                  <p>
                    Statut :{' '}
                    <Badge variant={getApprovalStatusColor(registration.approval_status) as any}>
                      {getApprovalStatusLabel(registration.approval_status)}
                    </Badge>
                  </p>
                  {registration.rejection_reason ? (
                    <p>Raison : {registration.rejection_reason}</p>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Téléversement de document
                </CardTitle>
              </CardHeader>
              <CardContent>
                {currentDocument ? (
                  <div className="mb-6 rounded-md border px-3 py-2 text-sm">
                    <p className="font-medium">Document actuel</p>
                    <p className="text-xs text-muted-foreground">
                      {currentDocument.filename} ({formatBytes(currentDocument.size)})
                    </p>
                  </div>
                ) : null}

                <DocumentUpload
                  registrationId={registration.id}
                  initialDocument={currentDocument}
                  requiredTypes={registration.ticket.document_types || []}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
}
