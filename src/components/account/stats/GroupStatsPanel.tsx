import { ComingSoon } from './ComingSoon'
import { Leaderboard } from './Leaderboard'
import { ChartBlock, Kpi, TIMING_HINT } from './StatsBlocks'
import { TEASER_GROUP_GOAL_KM, TEASER_LEADERBOARD } from './mockStats'
import { CompletionRing, DepartureBars, FormatDonut, SampleGroupKmChart } from './StatsCharts'
import type { GroupStats } from '@/lib/account/stats'

/**
 * Figures of a group: real registrations (members signed up, departure times,
 * formats) followed by blurred previews of what timing will unlock.
 */
export function GroupStatsPanel({ stats }: { stats: GroupStats }) {
  return (
    <div className="space-y-8">
      {stats.event ? (
        <div className="flex items-center gap-8">
          <CompletionRing value={stats.registeredMembers} total={stats.memberCount} />
          <div className="grid gap-6">
            <Kpi value={stats.bibs} label="Dossards" />
            <Kpi value={stats.checkedIn} label="Départs validés" />
          </div>
        </div>
      ) : (
        <p className="max-w-sm text-muted-foreground">Personne du groupe n&apos;est encore inscrit. Les stats apparaîtront avec les premiers dossards.</p>
      )}

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-x-12">
        {stats.event && stats.departures.length > 0 ? (
          <ChartBlock title="Heures de départ">
            <DepartureBars slots={stats.departures} />
          </ChartBlock>
        ) : null}
        {stats.event ? (
          <ChartBlock title="Formats">
            <FormatDonut counts={stats.byFormat} />
          </ChartBlock>
        ) : null}
        <ChartBlock title="Classement du groupe">
          <ComingSoon title="Qui a couru le plus loin ?" hint={TIMING_HINT}>
            <Leaderboard rows={TEASER_LEADERBOARD} />
          </ComingSoon>
        </ChartBlock>
        <ChartBlock title="Kilomètres du groupe">
          <ComingSoon title="Un objectif collectif à atteindre" hint={TIMING_HINT}>
            <SampleGroupKmChart goalKm={TEASER_GROUP_GOAL_KM} />
          </ComingSoon>
        </ChartBlock>
      </div>
    </div>
  )
}
