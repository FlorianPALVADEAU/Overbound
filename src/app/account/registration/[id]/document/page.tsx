/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSupabaseServer } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  FileText, 
  Calendar, 
  MapPin, 
  Trophy,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { DocumentUpload } from '@/components/admin/DocumentUpload'

interface DocumentPageProps {
  params: Promise<{ id: string }>
}

export default async function RegistrationDocumentPage({ params }: DocumentPageProps) {
  const supabase = await createSupabaseServer()
  const { id } = await params

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Récupérer l'inscription avec toutes les informations
  const { data: registration, error } = await supabase
    .from('registrations')
    .select(`
      *,
      ticket:tickets (
        id,
        name,
        description,
        requires_document,
        document_types,
        race:races!tickets_race_id_fkey (
          id,
          name,
          type,
          difficulty,
          distance_km
        )
      ),
      event:events (
        id,
        title,
        subtitle,
        date,
        location
      )
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !registration) {
    notFound()
  }

  // Vérifier si le ticket nécessite un document
  if (!registration.ticket.requires_document) {
    redirect(`/account/ticket/${registration.id}`)
  }

  const currentDocument = registration.document_url ? {
    url: registration.document_url,
    filename: registration.document_filename || 'Document',
    size: registration.document_size || 0
  } : undefined

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 3) return 'bg-green-100 text-green-800'
    if (difficulty <= 6) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  const getApprovalStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'default'
      case 'pending': return 'secondary'
      case 'rejected': return 'destructive'
      default: return 'outline'
    }
  }

  const getApprovalStatusLabel = (status: string) => {
    switch (status) {
      case 'approved': return 'Approuvé'
      case 'pending': return 'En attente'
      case 'rejected': return 'Rejeté'
      default: return 'Non validé'
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto p-6 max-w-4xl">
        {/* Navigation */}
        <div className="mb-6">
          <Link href="/account">
            <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à mes inscriptions
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <FileText className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2">Document justificatif</h1>
          <p className="text-muted-foreground">
            Téléchargez votre document pour valider votre inscription
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Informations de l'inscription */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Votre inscription
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold">{registration.event.title}</h3>
                  {registration.event.subtitle && (
                    <p className="text-sm text-muted-foreground">{registration.event.subtitle}</p>
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {new Date(registration.event.date).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{registration.event.location}</span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Format sélectionné</h4>
                  <p className="text-sm">{registration.ticket.name}</p>
                  
                  {registration.ticket.race && (
                    <Badge variant={getDifficultyColor(registration.ticket.race.difficulty) as any} className="mt-2">
                      {registration.ticket.race.name} - {registration.ticket.race.distance_km} km
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Téléchargement du document */}
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
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <h4 className="font-medium">{currentDocument.filename}</h4>
                      <p className="text-sm text-muted-foreground">
                        {formatBytes(currentDocument.size)}
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Télécharger
                    </Button>
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    Aucun document téléchargé.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
}