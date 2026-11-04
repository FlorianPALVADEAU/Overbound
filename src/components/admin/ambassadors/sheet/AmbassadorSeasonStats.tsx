'use client'

import { StatRow, type Stat } from '@/components/ds'
import { Progress } from '@/components/ui/progress'
import type { AdminAmbassadorSheetResponse } from '@/lib/admin/ambassadors/types'

const plural = (count: number, word: string) => `${count} ${word}${count > 1 ? 's' : ''}`

/** Season figures at a glance: points, referrals, the next ladder step and the bonus bibs. */
export function AmbassadorSeasonStats({ sheet }: { sheet: AdminAmbassadorSheetResponse }) {
  const { season, next_reward: next, bonus } = sheet
  const stats: Stat[] = [
    { label: 'Points', value: season.total_points, unit: 'pts', highlight: true },
    {
      label: 'Filleuls',
      value: season.recruits_open + season.recruits_ranked,
      unit: `${season.recruits_open} Open · ${season.recruits_ranked} Ranked`,
    },
    {
      label: 'Prochain palier',
      value: next ? next.reward_name : 'Tous atteints',
      unit: next ? `${plural(next.points_remaining, 'pt')} restant${next.points_remaining > 1 ? 's' : ''}` : undefined,
    },
    {
      label: 'Dossards bonus',
      value: bonus ? bonus.earned : '—',
      unit: bonus ? `prochain à ${bonus.next_points_required} pts` : undefined,
    },
  ]

  return (
    <div className="grid gap-3">
      <StatRow stats={stats} compact />
      {next ? (
        <Progress
          value={Math.min(100, Math.round((season.total_points / next.points_required) * 100))}
          aria-label={`Progression vers ${next.reward_name}`}
        />
      ) : null}
    </div>
  )
}
