'use client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Disclosure, StatRow } from '@/components/ds'
import { Calendar, MapPin, Users, BarChart3, Clock } from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts'

interface AdminOverviewStats {
  total_revenue_cents: number
  total_registrations: number
  checked_in_count: number
  total_events: number
  upcoming_events: number
  registrations_by_month: { month: string; count: number }[]
  ticket_distribution: { ticket_name: string; event_title: string; count: number }[]
  events_by_status: Record<string, number>
  next_event: {
    title: string
    date: string
    location: string
    registrations_count: number
    capacity: number
  } | null
}

interface AdminStatsProps {
  stats?: Record<string, unknown> | null
}

// Chart tokens (globals.css); the greens are the brand scale.
const COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)']
const PRIMARY = 'var(--primary)'

const TOOLTIP_STYLE = {
  backgroundColor: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: '12px',
  fontSize: '12px',
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon',
  announced: 'Annoncé',
  on_sale: 'En vente',
  sold_out: 'Complet',
  closed: 'Fermé',
  cancelled: 'Annulé',
  completed: 'Terminé',
}

export function AdminStats({ stats: rawStats }: AdminStatsProps) {
  if (!rawStats) {
    return (
      <div className="py-12 text-center">
        <BarChart3 className="mx-auto mb-4 size-12 text-muted-foreground" />
        <p className="text-muted-foreground">Impossible de charger les statistiques</p>
        <p className="mt-2 text-xs text-muted-foreground">
          Vérifiez que les fonctions RPC sont correctement installées
        </p>
      </div>
    )
  }

  const stats = rawStats as Partial<AdminOverviewStats>

  const monthlyData = Array.isArray(stats.registrations_by_month)
    ? stats.registrations_by_month.map((item) => ({
        ...item,
        month: new Date(item.month + '-01').toLocaleDateString('fr-FR', {
          month: 'short',
          year: '2-digit',
        }),
      }))
    : []

  const ticketData = Array.isArray(stats.ticket_distribution)
    ? stats.ticket_distribution.slice(0, 8).map((item) => ({
        name: item.ticket_name,
        value: item.count,
        fullName: `${item.ticket_name} — ${item.event_title}`,
      }))
    : []

  const statusData =
    stats.events_by_status && typeof stats.events_by_status === 'object'
      ? Object.entries(stats.events_by_status)
          .filter(([, count]) => count > 0)
          .map(([status, count]) => ({
            status: STATUS_LABELS[status] ?? status,
            count,
          }))
      : []

  const totalRegistrations = stats.total_registrations ?? 0
  const checkedIn = stats.checked_in_count ?? 0
  const nextEvent = stats.next_event ?? null

  return (
    <>
      <StatRow
        compact
        className="mb-8"
        stats={[
          {
            label: "Chiffre d'affaires",
            highlight: true,
            value: ((stats.total_revenue_cents ?? 0) / 100).toLocaleString('fr-FR', {
              style: 'currency',
              currency: 'EUR',
              maximumFractionDigits: 0,
            }),
            unit: 'validés',
          },
          { label: 'Inscriptions', value: totalRegistrations.toLocaleString('fr-FR'), unit: `${checkedIn} présents` },
          { label: 'Événements', value: stats.total_events ?? 0, unit: `${stats.upcoming_events ?? 0} à venir` },
          {
            label: 'Présence',
            value: `${totalRegistrations > 0 ? Math.round((checkedIn / totalRegistrations) * 100) : 0}%`,
            unit: 'taux',
          },
        ]}
      />

      {/* Prochain événement */}
      {nextEvent && (
        <Card variant="info" className="mb-8">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="size-4" />
              Prochain événement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl bg-linear-to-r from-primary/10 to-primary/5 p-5">
              <h3 className="mb-3 font-display text-title font-bold uppercase">{nextEvent.title}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="size-4 shrink-0 text-muted-foreground" />
                  <span>
                    {new Date(nextEvent.date).toLocaleString('fr-FR', {
                      dateStyle: 'long',
                      timeStyle: 'short',
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="size-4 shrink-0 text-muted-foreground" />
                  <span>{nextEvent.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="size-4 shrink-0 text-muted-foreground" />
                  <span>
                    {nextEvent.registrations_count} / {nextEvent.capacity} inscrits
                  </span>
                </div>
              </div>
              <div className="h-2 w-full rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-primary transition-all duration-300 ease-standard"
                  style={{
                    width: `${Math.min(
                      100,
                      (nextEvent.registrations_count / nextEvent.capacity) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Graphiques */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Évolution des inscriptions */}
        <Disclosure title="Inscriptions / mois" defaultOpen={true}>
            {monthlyData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
                Pas encore de données
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={monthlyData}
                    margin={{ top: 4, right: 16, bottom: 40, left: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 11 }}
                      angle={-40}
                      textAnchor="end"
                      interval={0}
                      height={50}
                    />
                    <YAxis tick={{ fontSize: 11 }} width={32} allowDecimals={false} />
                    <Tooltip
                      formatter={(value: number) => [`${value} inscriptions`, 'Inscriptions']}
                      contentStyle={TOOLTIP_STYLE}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke={PRIMARY}
                      strokeWidth={2.5}
                      dot={{ fill: PRIMARY, r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </Disclosure>

        {/* Répartition des tickets */}
        <Disclosure title="Répartition des tickets" defaultOpen={false}>
            {ticketData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
                Pas encore de données
              </div>
            ) : (
              <>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={ticketData}
                        cx="50%"
                        cy="50%"
                        outerRadius={72}
                        dataKey="value"
                        labelLine={false}
                        label={({ percent }) =>
                          percent > 0.06 ? `${Math.round(percent * 100)}%` : ''
                        }
                      >
                        {ticketData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number, _name: string, item: { payload?: { fullName?: string } }) => [
                          `${value} inscriptions`,
                          item.payload?.fullName ?? '',
                        ]}
                        contentStyle={TOOLTIP_STYLE}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 space-y-2">
                  {ticketData.map((item, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <div
                        className="size-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="truncate flex-1 text-muted-foreground">{item.fullName}</span>
                      <span className="font-medium tabular-nums">{item.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Disclosure>
      </div>

      {/* Statut des événements — horizontal bar */}
      {statusData.length > 0 && (
        <Disclosure title="Événements par statut" defaultOpen={false}>
            <div style={{ height: Math.max(120, statusData.length * 44) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={statusData}
                  layout="vertical"
                  margin={{ top: 0, right: 32, bottom: 0, left: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} className="opacity-20" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11 }}
                    allowDecimals={false}
                    width={32}
                  />
                  <YAxis
                    type="category"
                    dataKey="status"
                    tick={{ fontSize: 12 }}
                    width={80}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${value} événement${value > 1 ? 's' : ''}`, '']}
                    contentStyle={TOOLTIP_STYLE}
                  />
                  <Bar dataKey="count" fill={PRIMARY} radius={[0, 4, 4, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Disclosure>
      )}
    </>
  )
}
