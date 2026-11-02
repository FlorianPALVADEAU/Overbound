'use client'

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { AdminOverviewData } from '@/lib/admin/overview'

const TOOLTIP_STYLE = {
  backgroundColor: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: '12px',
  fontSize: '12px',
}

const shortDate = (key: string) =>
  new Date(`${key}T12:00:00Z`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', timeZone: 'Europe/Paris' })

const money = (cents: number, currency: string) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: currency.toUpperCase(), maximumFractionDigits: 0 }).format(cents / 100)

/** Registrations per day; the tooltip adds the day's revenue. */
export function SalesChart({ data, currency }: { data: AdminOverviewData['salesByDay']; currency: string }) {
  const total = data.reduce((sum, day) => sum + day.registrations, 0)
  if (total === 0) {
    return <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">Aucune inscription sur la période.</div>
  }
  return (
    <div className="h-64" role="img" aria-label={`${total} inscriptions sur les 30 derniers jours`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} className="opacity-20" />
          <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 11 }} interval="preserveStartEnd" minTickGap={24} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={28} />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            labelFormatter={(label) => shortDate(String(label))}
            formatter={(value, _name, item) => [
              `${value} inscription${Number(value) > 1 ? 's' : ''} · ${money((item.payload as { revenueCents: number }).revenueCents, currency)}`,
              '',
            ]}
          />
          <Bar dataKey="registrations" fill="var(--primary)" radius={[4, 4, 0, 0]} maxBarSize={20} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
