'use client'

import Link from 'next/link'
import { AlertCircle, ArrowLeft } from 'lucide-react'
import { useAdminEventDetail } from '@/app/api/admin/events/eventsQueries'
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader'
import { EventParticipantsList } from '@/components/admin/events/EventParticipantsList'
import { UpsellSummaryPanel } from '@/components/admin/registrations/UpsellSummaryPanel'
import { StatRow } from '@/components/ds'
import { Button } from '@/components/ui/button'

const count = (value?: number) => (value ?? 0).toLocaleString('fr-FR')

const money = (cents: number, currency: string | null | undefined) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: (currency ?? 'EUR').toUpperCase(), maximumFractionDigits: 0 }).format(cents / 100)

/** Everything an admin does with the people registered to one event, in one place. */
export function AdminParticipantsPage({ eventId }: { eventId: string }) {
  const { data, error } = useAdminEventDetail(eventId)
  const event = data?.event
  const stats = data?.stats

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/events"><ArrowLeft />Événements</Link>
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild><Link href={`/dashboard/checkin?event=${eventId}`}>Check-in</Link></Button>
          <Button variant="outline" size="sm" asChild><Link href={`/dashboard/events/${eventId}/tickets`}>Billets</Link></Button>
          <Button variant="outline" size="sm" asChild><Link href={`/dashboard/events/${eventId}`}>Fiche événement</Link></Button>
        </div>
      </div>

      <AdminPageHeader
        eyebrow="Billetterie"
        title="Participants"
        description={event ? `${event.title}${event.location ? ` · ${event.location}` : ''}` : undefined}
      />

      {error ? (
        <p className="flex items-center gap-2 text-sm text-destructive"><AlertCircle className="size-4" />{error.message}</p>
      ) : (
        <StatRow
          compact
          stats={[
            { label: 'Inscriptions', value: count(stats?.registrations.total), unit: `${count(stats?.registrations.checked_in)} présents` },
            { label: 'Capacité', value: event?.capacity ? count(event.capacity) : '—', unit: event?.capacity && stats ? `${Math.round((stats.registrations.total / event.capacity) * 100)} % remplie` : undefined },
            { label: 'Chiffre d’affaires', value: money(stats?.revenue.total_cents ?? 0, stats?.revenue.currency), highlight: true, unit: 'commandes payées' },
          ]}
        />
      )}

      <UpsellSummaryPanel eventId={eventId} />
      <EventParticipantsList eventId={eventId} />
    </div>
  )
}
