'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CalendarDays, MapPin, RefreshCw, Users, AlertCircle } from 'lucide-react'
import { useSession } from '@/app/api/session/sessionQueries'
import {
  useAdminEventDetail,
  type AdminEventDetailResponse,
} from '@/app/api/admin/events/eventsQueries'
import { EventParticipantsList } from './EventParticipantsList'
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader'
import { StatRow } from '@/components/ds'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import EventVolunteersTable from './EventVolunteersTable'
import { EventPriceTierManager } from './EventPriceTierManager'
import type { EventPriceTier } from '@/types/EventPriceTier'

type ViewMode = 'all' | 'participants' | 'volunteers'

interface AdminEventDetailPageProps {
  eventId: string
}

const statusLabel = (status: string) => {
  switch (status) {
    case 'on_sale':
      return 'En vente'
    case 'draft':
      return 'Brouillon'
    case 'announced':
      return 'Ouvert (inscriptions à venir)'
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
    case 'announced':
      return 'secondary' as const
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

export default function AdminEventDetailPage({ eventId }: AdminEventDetailPageProps) {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<ViewMode>('all')
  const [priceTiers, setPriceTiers] = useState<EventPriceTier[]>([])
  const { data: session, isLoading: sessionLoading } = useSession()
  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useAdminEventDetail(eventId)

  // Load price tiers when event data is loaded
  useEffect(() => {
    if (data?.event) {
      const eventWithTiers = data.event as { price_tiers?: EventPriceTier[] }
      setPriceTiers(eventWithTiers.price_tiers || [])
    }
  }, [data])

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
      { label: 'Participants', value: 'participants' },
      { label: 'Bénévoles', value: 'volunteers' },
    ],
    [],
  )

  if (sessionLoading || !session?.user) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">Chargement…</div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 px-6 text-center">
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
    )
  }

  const money = formatCurrency(stats?.revenue.total_cents ?? 0, stats?.revenue.currency)
  const count = (value?: number) => (value ?? 0).toLocaleString('fr-FR')

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/events">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour aux événements
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          {event?.status ? (
            <Badge variant={statusVariant(event.status)} className="capitalize">
              {statusLabel(event.status)}
            </Badge>
          ) : null}
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualiser
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <AdminPageHeader eyebrow="Événement" title={event?.title ?? 'Événement'} description={event?.subtitle ?? undefined} />
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
      </div>

      <StatRow
        compact
        stats={[
          { label: 'Inscriptions', value: count(stats?.registrations.total), unit: `${count(stats?.registrations.approved)} approuvés` },
          { label: 'En attente', value: count(stats?.registrations.pending), unit: 'à examiner' },
          { label: 'Bénévoles', value: count(stats?.volunteers.total), unit: 'candidatures' },
          { label: 'Renta totale', value: money, highlight: true, unit: 'commandes payées' },
        ]}
      />

      <section className="space-y-4">
        <AdminPageHeader as="h2" title="Paliers de prix" />
        <EventPriceTierManager
          eventId={eventId}
          tiers={priceTiers}
          onTiersChange={(newTiers) => {
            setPriceTiers(newTiers)
            refetch() // Rafraîchir les données pour afficher les changements
          }}
        />
      </section>

      <section className="flex flex-wrap items-center justify-between gap-3">
        <AdminPageHeader as="h2" title="Gestion des participants" />
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
        <Card variant="info">
          <CardContent className="space-y-4 p-6 text-sm text-muted-foreground">
            Chargement des informations participants…
          </CardContent>
        </Card>
      ) : null}

      {(viewMode === 'all' || viewMode === 'participants') && <EventParticipantsList eventId={eventId} />}

      {(viewMode === 'all' || viewMode === 'volunteers') && <EventVolunteersTable eventId={eventId} />}
    </div>
  )
}
