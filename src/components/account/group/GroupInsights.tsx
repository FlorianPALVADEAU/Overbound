'use client'

import { useAccountStats } from '@/app/api/account/stats/accountStatsQueries'
import { Eyebrow } from '@/components/account/AccountScreen'
import { GroupChallenge } from '@/components/account/stats/GroupChallenge'
import { GroupStatsPanel } from '@/components/account/stats/GroupStatsPanel'
import { Skeleton } from '@/components/ui/skeleton'

/** Group-only figures and challenge, shown under the member list (never for users without a group). */
export function GroupInsights() {
  const { data, isLoading } = useAccountStats()

  if (isLoading) return <Skeleton className="h-64 w-full rounded-2xl" />
  // Stats are best-effort here: the group page stays fully usable if they fail to load.
  if (!data?.group) return null

  return (
    <div className="space-y-10">
      <GroupChallenge />
      <section className="border-t border-border pt-5">
        <Eyebrow className="mb-6">Statistiques du groupe</Eyebrow>
        <GroupStatsPanel stats={data.group} />
      </section>
    </div>
  )
}
