'use client'

import { StatRow } from '@/components/ds'

interface RegistrationStatsProps {
  stats: {
    total: number
    checked_in: number
  }
}

export function RegistrationStats({ stats }: RegistrationStatsProps) {
  return (
    <StatRow
      compact
      stats={[
        { label: 'Total', value: stats.total },
        { label: 'Présents', value: stats.checked_in, highlight: true },
      ]}
    />
  )
}
