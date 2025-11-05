'use client'

import { useEffect, useMemo, useState, type ComponentType } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CalendarDays, MapPin, RefreshCw, Users, CheckCircle2, AlertCircle, Coins } from 'lucide-react'
import { useSession } from '@/app/api/session/sessionQueries'
import {
  useAdminEventDetail,
  type AdminEventDetailResponse,
} from '@/app/api/admin/events/eventsQueries'
import { RegistrationsSection } from '@/components/admin/registrations'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import EventVolunteersTable from './EventVolunteersTable'

type ViewMode = 'all' | 'runners' | 'volunteers'

interface AdminEventDetailPageProps {
  eventId: string
}

const statusLabel = (status: string) => {
  switch (status) {
    case 'on_sale':
      return 'En vente'
    case 'draft':
      return 'Brouillon'
    case 'sold_out':
      return 'Complet'
    case 'closed':
      return 'Clôturé'
    case 'cancelled':
      return 'Annulé'
    case 'completed':
      return 'Terminé'
    default:
      return status
  }
}

const statusVariant = (status: string) => {
  switch (status) {
    case 'on_sale':
      return 'default' as const
    case 'sold_out':
    case 'closed':
      return 'outline' as const
    case 'cancelled':
      return 'destructive' as const
    default:
      return 'secondary' as const
  }
}

const formatEventDate = (value?: string | null) =>
  value
    ? new Date(value).toLocaleString('fr-FR', {
        dateStyle: 'full',
        timeStyle: 'short',
      })
    : 'Date à confirmer'

const formatCurrency = (amountCents: number, currency?: string | null) => {
  const currencyCode = (currency ?? 'EUR').toUpperCase()
  const amount = amountCents / 100
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

const StatCard = ({
  title,
  value,
  description,
  icon,
  accent,
}: {
  title: string
  value: string
  description?: string
  icon: ComponentType<{ className?: string }>
  accent?: string
}) => {
  const Icon = icon
  return (
    <Card>
      <CardContent className="flex items-start gap-4 p-4 md:p-6">
        <span
          className={`flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary ${accent ?? ''}`}
        >
          <Icon className="h-5 w-5" />
        </span>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-semibold text-foreground">{value}</p>
          {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
        </div>
      </CardContent>
    </Card>
  )
}

export default function AdminEventDetailPage({ eventId }: AdminEventDetailPageProps) {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<ViewMode>('all')
  const { data: session, isLoading: sessionLoading } = useSession()
  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useAdminEventDetail(eventId)

  useEffect(() => {
    if (!sessionLoading && !session?.user) {
      router.replace(`/auth/login?next=/dashboard/events/${eventId}`)
    }
  }, [eventId, router, session?.user, sessionLoading])

  const event = data?.event
  const stats = data?.stats

  const viewOptions: { label: string; value: ViewMode }[] = useMemo(
    () => [
      { label: 'Tout', value: 'all' },
      { label: 'Coureurs', value: 'runners' },
      { label: 'Bénévoles', value: 'volunteers' },
    ],
    [],
  )

  if (sessionLoading || !session?.user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/30">
        <div className="text-sm text-muted-foreground">Chargement…</div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen bg-muted/30 max-w-screen">
        <div className="mx-auto flex min-h-[60vh] w-screen flex-col items-center justify-center gap-4 px-6 text-center">
          <AlertCircle className="h-10 w-10 text-destructive" />
          <p className="text-sm text-muted-foreground">
            {(error as Error).message || 'Impossible de charger les détails de cet événement.'}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.back()}>
              Retour
            </Button>
            <Button onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Réessayer
            </Button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-muted/30">
      <div className="mx-auto w-full max-w-[80vw] space-y-6 px-4 py-6 md:px-6 lg:py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour au tableau de bord
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            {event?.status ? (
              <Badge variant={statusVariant(event.status)} className="capitalize">
                {statusLabel(event.status)}
              </Badge>
            ) : null}
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Actualiser
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">{event?.title ?? 'Événement'}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              {formatEventDate(event?.date ?? null)}
            </span>
            {event?.location ? (
              <span className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {event.location}
              </span>
            ) : null}
            <span className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Capacité : {event?.capacity?.toLocaleString('fr-FR') ?? '—'}
            </span>
          </div>
          {event?.subtitle ? (
            <p className="text-sm text-muted-foreground">{event.subtitle}</p>
          ) : null}
        </div>

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Inscriptions totales"
            value={(stats?.registrations.total ?? 0).toLocaleString('fr-FR')}
            icon={Users}
            description="Coureurs enregistrés sur cet événement"
          />
          <StatCard
            title="Coureurs approuvés"
            value={(stats?.registrations.approved ?? 0).toLocaleString('fr-FR')}
            icon={CheckCircle2}
            description="Dossiers validés par l’équipe"
          />
          <StatCard
            title="En attente"
            value={(stats?.registrations.pending ?? 0).toLocaleString('fr-FR')}
            icon={AlertCircle}
            description="Inscriptions à examiner"
          />
          <StatCard
            title="Bénévoles"
            value={(stats?.volunteers.total ?? 0).toLocaleString('fr-FR')}
            icon={Users}
            description="Candidatures bénévoles reçues"
          />
        </section>
          <StatCard
            title="Renta totale"
            value={formatCurrency(stats?.revenue.total_cents ?? 0, stats?.revenue.currency)}
            icon={Coins}
            accent="!bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-600"
            description="Commandes payées recensées pour cet événement"
          />

        <section className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-foreground">Gestion des participants</h2>
          <div className="flex gap-2">
            {viewOptions.map((option) => (
              <Button
                key={option.value}
                variant={viewMode === option.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </section>

        {isLoading ? (
          <Card>
            <CardContent className="space-y-4 p-6 text-sm text-muted-foreground">
              Chargement des informations participants…
            </CardContent>
          </Card>
        ) : null}

        {(viewMode === 'all' || viewMode === 'runners') && (
          <RegistrationsSection eventId={eventId} lockEventFilter />
        )}

        {(viewMode === 'all' || viewMode === 'volunteers') && <EventVolunteersTable eventId={eventId} />}
      </div>
    </main>
  )
}
