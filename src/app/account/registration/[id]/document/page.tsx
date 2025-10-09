'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Calendar, MapPin, ArrowLeft, BadgeCheck, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DocumentUpload } from '@/components/admin/DocumentUpload'
import { useSession } from '@/app/api/session/sessionQueries'
import { useRegistrationDocument } from '@/app/api/account/registrations/[id]/document-data/documentDataQueries'

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
    <main className="min-h-screen bg-muted/30">
      <div className="container mx-auto max-w-4xl px-6 py-12">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <Link href="/account">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Retour à mes inscriptions
            </Button>
          </Link>
          <div className="text-right text-xs text-muted-foreground md:text-sm">
            Besoin d’aide ? Écris-nous à{' '}
            <a href="mailto:support@overbound-race.fr" className="font-medium text-foreground underline">
              support@overbound-race.fr
            </a>
          </div>
        </div>

        <div className="mb-10 space-y-3 text-center">
          <Badge variant="secondary" className="px-3 py-1">
            Document requis
          </Badge>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Ajoute ton justificatif pour finaliser ton inscription
          </h1>
          <p className="mx-auto max-w-2xl text-sm text-muted-foreground md:text-base">
            Nous avons besoin d’un document valide pour confirmer ta participation. Téléverse-le en
            quelques secondes, puis laisse notre équipe le valider.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <Card className="h-full border-border/70 bg-background/80">
            <CardContent className="space-y-5 p-6">
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">Événement</p>
                <h2 className="mt-1 text-xl font-semibold text-foreground">
                  {registration.event.title}
                </h2>
                {registration.event.subtitle ? (
                  <p className="text-sm text-muted-foreground">{registration.event.subtitle}</p>
                ) : null}
              </div>

              <div className="space-y-3 rounded-xl border border-dashed border-border/60 bg-muted/20 p-4 text-sm">
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-primary/10 p-2 text-primary-foreground">
                    <Calendar className="h-4 w-4 text-primary" />
                  </span>
                  <span>
                    {new Date(registration.event.date).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-primary/10 p-2 text-primary-foreground">
                    <MapPin className="h-4 w-4 text-primary" />
                  </span>
                  <span>{registration.event.location}</span>
                </div>
              </div>

              <div className="space-y-2 rounded-xl border border-border/50 bg-background/60 p-4 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase text-muted-foreground">
                      Format choisi
                    </p>
                    <p className="font-medium text-foreground">{registration.ticket.name}</p>
                  </div>
                  {registration.ticket.race ? (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <BadgeCheck className="h-3 w-3" />
                      {registration.ticket.race.name}
                    </Badge>
                  ) : null}
                </div>
                <div className="text-xs text-muted-foreground">
                  {registration.approval_status === 'approved' ? (
                    <span className="flex items-center gap-1 text-emerald-600">
                      <BadgeCheck className="h-3 w-3" />
                      Document validé
                    </span>
                  ) : registration.approval_status === 'rejected' ? (
                    <span className="flex items-center gap-1 text-red-600">
                      <AlertCircle className="h-3 w-3" />
                      Document rejeté — merci de déposer un nouveau fichier.
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-amber-600">
                      <AlertCircle className="h-3 w-3" />
                      Document en attente de validation.
                    </span>
                  )}
                </div>
                {registration.rejection_reason ? (
                  <p className="rounded-lg bg-destructive/10 p-2 text-xs text-destructive">
                    Motif : {registration.rejection_reason}
                  </p>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-background/80">
            <CardContent className="p-6">
              <DocumentUpload
                registrationId={registration.id}
                existingDocument={currentDocument}
                status={registration.approval_status as 'pending' | 'approved' | 'rejected'}
                rejectionReason={registration.rejection_reason}
                requiredTypes={registration.ticket.document_types || []}
                onUploaded={() => refetch()}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
