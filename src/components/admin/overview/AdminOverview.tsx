'use client'

import Link from 'next/link'
import { AlertTriangle, ArrowRight, CalendarDays, CheckCircle2, Info, MapPin, RefreshCw, TrendingDown, TrendingUp } from 'lucide-react'
import { useAdminOverview } from '@/app/api/admin/overview/overviewQueries'
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader'
import { ExternalToolLinks } from '@/components/admin/overview/ExternalToolLinks'
import { SalesChart } from '@/components/admin/overview/SalesChart'
import { Disclosure, StatRow } from '@/components/ds'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { AdminOverviewData, OverviewTodoTone } from '@/lib/admin/overview'
import { cn } from '@/lib/utils'

const TONE_CLASS: Record<OverviewTodoTone, string> = {
  danger: 'border-destructive/40 bg-destructive/10 text-destructive',
  warning: 'border-warning/40 bg-warning/15 text-warning',
  info: 'border-info/40 bg-info/15 text-info',
}

const money = (cents: number, currency: string) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: currency.toUpperCase(), maximumFractionDigits: 0 }).format(cents / 100)

const percent = (ratio: number | null) => (ratio === null ? '—' : `${Math.round(ratio * 100)} %`)

function TrendLabel({ last7Days, previous7Days }: AdminOverviewData['trend']) {
  const Icon = last7Days >= previous7Days ? TrendingUp : TrendingDown
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
      <Icon className={cn('size-4', last7Days >= previous7Days ? 'text-success' : 'text-warning')} aria-hidden />
      {last7Days} inscription{last7Days > 1 ? 's' : ''} sur 7 jours, contre {previous7Days} la semaine d’avant
    </span>
  )
}

function TodoCard({ todo }: { todo: AdminOverviewData['todo'] }) {
  return (
    <Card variant="info">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          {todo.length === 0 ? <CheckCircle2 className="size-4 text-success" aria-hidden /> : <AlertTriangle className="size-4 text-warning" aria-hidden />}
          À traiter
        </CardTitle>
      </CardHeader>
      <CardContent>
        {todo.length === 0 ? (
          <p className="text-sm text-muted-foreground">Rien ne demande ton attention pour l’instant.</p>
        ) : (
          <ul className="divide-y divide-border">
            {todo.map((item) => (
              <li key={item.id}>
                <Link href={item.href} className="group flex items-center gap-3 py-3 transition-colors hover:text-primary">
                  <span className={cn('inline-flex min-w-8 justify-center rounded-full border px-2 py-0.5 text-sm font-semibold tabular-nums', TONE_CLASS[item.tone])}>
                    {item.count}
                  </span>
                  <span className="min-w-0 flex-1 text-sm">{item.label}</span>
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 ease-standard group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

function NextEventCard({ event }: { event: NonNullable<AdminOverviewData['nextEvent']> }) {
  const fill = event.capacity ? Math.min(100, (event.registrations / event.capacity) * 100) : null
  return (
    <Card variant="info">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Prochain événement</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="font-display text-title font-bold uppercase">{event.title}</p>
          <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><CalendarDays className="size-4" aria-hidden />{new Date(event.date).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Europe/Paris' })}</span>
            {event.location ? <span className="inline-flex items-center gap-1.5"><MapPin className="size-4" aria-hidden />{event.location}</span> : null}
          </p>
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between text-sm">
            <span>{event.registrations.toLocaleString('fr-FR')} inscrits</span>
            {event.capacity ? <span className="text-muted-foreground">sur {event.capacity.toLocaleString('fr-FR')}</span> : null}
          </div>
          {fill !== null ? (
            <div className="h-2 w-full rounded-full bg-muted" role="progressbar" aria-valuenow={Math.round(fill)} aria-valuemin={0} aria-valuemax={100} aria-label="Remplissage">
              <div className="h-2 rounded-full bg-primary transition-all duration-300 ease-standard" style={{ width: `${fill}%` }} />
            </div>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm"><Link href={`/dashboard/events/${event.id}/participants`}>Participants</Link></Button>
          <Button asChild size="sm" variant="outline"><Link href={`/dashboard/checkin?event=${event.id}`}>Check-in</Link></Button>
          <Button asChild size="sm" variant="outline"><Link href={`/dashboard/events/${event.id}`}>Fiche événement</Link></Button>
        </div>
      </CardContent>
    </Card>
  )
}

function TicketBreakdown({ tickets }: { tickets: AdminOverviewData['tickets'] }) {
  const total = tickets.reduce((sum, ticket) => sum + ticket.count, 0)
  return (
    <Disclosure title="Répartition par billet" summary={`${tickets.length} billet${tickets.length > 1 ? 's' : ''}`}>
      {tickets.length === 0 ? (
        <p className="p-4 text-sm text-muted-foreground">Pas encore d’inscription.</p>
      ) : (
        <ul className="space-y-3 p-4">
          {tickets.map((ticket) => (
            <li key={ticket.id} className="space-y-1">
              <div className="flex justify-between gap-3 text-sm">
                <span className="min-w-0 truncate">{ticket.name}</span>
                <span className="shrink-0 tabular-nums text-muted-foreground">{ticket.count} · {Math.round((ticket.count / total) * 100)} %</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted">
                <div className="h-1.5 rounded-full bg-primary" style={{ width: `${(ticket.count / total) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Disclosure>
  )
}

/** Landing page of the back-office: what needs attention, the key figures, the sales curve. */
export function AdminOverview({ eventId }: { eventId: string | null }) {
  const { data, error, isLoading, isFetching, refetch } = useAdminOverview(eventId)

  const description = data?.scope
    ? `Chiffres de ${data.scope.title}. Choisis « Aucun événement » dans la barre du haut pour tout voir.`
    : 'Tous les événements. Choisis un événement dans la barre du haut pour le détailler.'

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Administration"
        title="Tableau de bord"
        description={description}
        actions={
          <Button type="button" variant="outline" size="sm" onClick={() => void refetch()} disabled={isFetching}>
            <RefreshCw className={isFetching ? 'animate-spin' : undefined} />
            Actualiser
          </Button>
        }
      />

      {error && !data ? (
        <Card variant="info">
          <CardContent className="flex flex-col items-start gap-3 p-6 text-sm">
            <p className="flex items-center gap-2 font-medium text-destructive"><Info className="size-4" aria-hidden />Impossible de charger le tableau de bord</p>
            <p className="text-muted-foreground">{error.message}</p>
            <Button type="button" size="sm" onClick={() => void refetch()}>Réessayer</Button>
          </CardContent>
        </Card>
      ) : isLoading || !data ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : (
        <>
          <TodoCard todo={data.todo} />

          <div className="space-y-2">
            <StatRow
              compact
              stats={[
                { label: 'Chiffre d’affaires', highlight: true, value: money(data.kpis.revenueCents, data.kpis.currency), unit: data.kpis.refundedCents > 0 ? `dont ${money(data.kpis.refundedCents, data.kpis.currency)} remboursés` : 'net' },
                { label: 'Inscriptions', value: data.kpis.registrations.toLocaleString('fr-FR'), unit: data.kpis.cancelled > 0 ? `${data.kpis.cancelled} annulées` : undefined },
                { label: 'Remplissage', value: percent(data.kpis.fillRate), unit: data.kpis.capacity ? `sur ${data.kpis.capacity.toLocaleString('fr-FR')}` : undefined },
                { label: 'Présence', value: percent(data.kpis.checkInRate), unit: `${data.kpis.checkedIn} check-ins` },
              ]}
            />
            <TrendLabel {...data.trend} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Disclosure title="Ventes des 30 derniers jours" defaultOpen>
              <SalesChart data={data.salesByDay} currency={data.kpis.currency} />
            </Disclosure>
            {data.nextEvent ? <NextEventCard event={data.nextEvent} /> : null}
          </div>

          <TicketBreakdown tickets={data.tickets} />
        </>
      )}

      <ExternalToolLinks />
    </div>
  )
}
