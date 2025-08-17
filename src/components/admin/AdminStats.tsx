/* eslint-disable @typescript-eslint/no-explicit-any */
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
  Clock
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts'

interface AdminStatsProps {
  stats: any
}

const COLORS = ['#019B01', '#10B981', '#059669', '#047857', '#065F46', '#064E3B', '#022c22']

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

  // Debug: afficher les données reçues
  console.log('Stats reçues:', stats)

  // Préparer les données pour les graphiques avec gestion des erreurs
  const monthlyData = Array.isArray(stats.registrations_by_month) 
    ? stats.registrations_by_month.map((item: any) => ({
        ...item,
        month: new Date(item.month + '-01').toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })
      })) 
    : []

  const ticketData = Array.isArray(stats.ticket_distribution) 
    ? stats.ticket_distribution.slice(0, 8).map((item: any) => ({
        name: `${item.ticket_name} (${item.event_title})`.slice(0, 30),
        value: item.count,
        fullName: `${item.ticket_name} - ${item.event_title}`
      })) 
    : []

  const statusData = stats.events_by_status && typeof stats.events_by_status === 'object'
    ? Object.entries(stats.events_by_status).map(([status, count]) => ({
        status: status === 'draft' ? 'Brouillon' : 
                status === 'on_sale' ? 'En vente' :
                status === 'sold_out' ? 'Complet' : 
                status === 'closed' ? 'Fermé' : status,
        count: count as number
      }))
    : []

  return (
    <>
      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Euro className="h-4 w-4" />
              Chiffre d'affaires
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {((stats.total_revenue_cents || 0) / 100).toLocaleString('fr-FR', {
                style: 'currency',
                currency: 'EUR'
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total des paiements validés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Ticket className="h-4 w-4" />
              Inscriptions totales
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
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Événements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.total_events || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.upcoming_events || 0} à venir
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Taux de présence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.total_registrations > 0 
                ? Math.round((stats.checked_in_count / stats.total_registrations) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Participants confirmés
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Prochain événement */}
      {stats.next_event && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Prochain événement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-2">{stats.next_event.title}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {new Date(stats.next_event.date).toLocaleString('fr-FR', {
                      dateStyle: 'full',
                      timeStyle: 'short'
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{stats.next_event.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {stats.next_event.registrations_count} / {stats.next_event.capacity} inscrits
                  </span>
                </div>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary rounded-full h-2 transition-all"
                  style={{ 
                    width: `${Math.min(100, (stats.next_event.registrations_count / stats.next_event.capacity) * 100)}%` 
                  }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Évolution des inscriptions */}
        <Card>
          <CardHeader>
            <CardTitle>Évolution des inscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#019B01" 
                    strokeWidth={3}
                    dot={{ fill: '#019B01', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Répartition des tickets */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition des tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ticketData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${Math.round(percent)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {ticketData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number, name: string, props: any) => [
                      `${value} inscriptions`,
                      props.payload.fullName
                    ]}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {ticketData.slice(0, 4).map((item, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="truncate flex-1">{item.fullName}</span>
                  <span className="font-medium">{item.value}</span>
                </div>
              ))}
              {ticketData.length > 4 && (
                <p className="text-xs text-muted-foreground">
                  Et {ticketData.length - 4} autres...
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statut des événements */}
      <Card>
        <CardHeader>
          <CardTitle>Statut des événements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="status" 
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="count" fill="#019B01" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </>
  )
}