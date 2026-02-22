'use client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Calendar,
  MapPin,
  Ticket,
  Users,
  TrendingUp,
  Euro,
  BarChart3,
  Clock,
} from 'lucide-react'
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

interface AdminStatsProps {
  stats: any
}

const COLORS = ['#019B01', '#10B981', '#059669', '#047857', '#065F46', '#064E3B', '#022c22']

const STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon',
  announced: 'Annoncé',
  on_sale: 'En vente',
  sold_out: 'Complet',
  closed: 'Fermé',
  cancelled: 'Annulé',
  completed: 'Terminé',
}

export function AdminStats({ stats }: AdminStatsProps) {
  if (!stats) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Impossible de charger les statistiques</p>
        <p className="text-xs text-muted-foreground mt-2">
          Vérifiez que les fonctions RPC sont correctement installées
        </p>
      </div>
    )
  }

  const monthlyData = Array.isArray(stats.registrations_by_month)
    ? stats.registrations_by_month.map((item: any) => ({
        ...item,
        month: new Date(item.month + '-01').toLocaleDateString('fr-FR', {
          month: 'short',
          year: '2-digit',
        }),
      }))
    : []

  const ticketData = Array.isArray(stats.ticket_distribution)
    ? stats.ticket_distribution.slice(0, 8).map((item: any) => ({
        name: item.ticket_name,
        value: item.count,
        fullName: `${item.ticket_name} — ${item.event_title}`,
      }))
    : []

  const statusData =
    stats.events_by_status && typeof stats.events_by_status === 'object'
      ? Object.entries(stats.events_by_status)
          .filter(([, count]) => (count as number) > 0)
          .map(([status, count]) => ({
            status: STATUS_LABELS[status] ?? status,
            count: count as number,
          }))
      : []

  return (
    <>
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
              <Euro className="h-3.5 w-3.5" />
              Chiffre d'affaires
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {((stats.total_revenue_cents || 0) / 100).toLocaleString('fr-FR', {
                style: 'currency',
                currency: 'EUR',
                maximumFractionDigits: 0,
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Paiements validés</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
              <Ticket className="h-3.5 w-3.5" />
              Inscriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats.total_registrations || 0).toLocaleString('fr-FR')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.checked_in_count || 0} présents
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5" />
              Événements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_events || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.upcoming_events || 0} à venir
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5" />
              Présence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.total_registrations > 0
                ? Math.round((stats.checked_in_count / stats.total_registrations) * 100)
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground mt-1">Taux de présence</p>
          </CardContent>
        </Card>
      </div>

      {/* Prochain événement */}
      {stats.next_event && (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4" />
              Prochain événement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-5">
              <h3 className="text-lg font-semibold mb-3">{stats.next_event.title}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>
                    {new Date(stats.next_event.date).toLocaleString('fr-FR', {
                      dateStyle: 'long',
                      timeStyle: 'short',
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{stats.next_event.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>
                    {stats.next_event.registrations_count} / {stats.next_event.capacity} inscrits
                  </span>
                </div>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary rounded-full h-2 transition-all"
                  style={{
                    width: `${Math.min(
                      100,
                      (stats.next_event.registrations_count / stats.next_event.capacity) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Évolution des inscriptions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Inscriptions / mois</CardTitle>
          </CardHeader>
          <CardContent>
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
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#019B01"
                      strokeWidth={2.5}
                      dot={{ fill: '#019B01', r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Répartition des tickets */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Répartition des tickets</CardTitle>
          </CardHeader>
          <CardContent>
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
                        {ticketData.map((_: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number, _: string, props: any) => [
                          `${value} inscriptions`,
                          props.payload.fullName,
                        ]}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 space-y-1.5">
                  {ticketData.map((item: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <div
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="truncate flex-1 text-muted-foreground">{item.fullName}</span>
                      <span className="font-medium tabular-nums">{item.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Statut des événements — horizontal bar */}
      {statusData.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Événements par statut</CardTitle>
          </CardHeader>
          <CardContent>
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
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="count" fill="#019B01" radius={[0, 4, 4, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}
