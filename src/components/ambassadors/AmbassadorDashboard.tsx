'use client'

import { useState } from 'react'
import type { AmbassadorDashboardData } from '@/types/Ambassador'
import { AMBASSADOR_REWARD_LEVELS } from '@/lib/ambassadors/program'
import { getCurrentSegmentFill } from '@/lib/ambassadors/dashboardPresentation'
import { useClaimAmbassadorReward } from '@/hooks/ambassadors/useClaimAmbassadorReward'
import { Container } from '@/components/ds'
import { AmbassadorHero } from '@/components/ambassadors/AmbassadorHero'
import { AmbassadorCodeCard } from '@/components/ambassadors/AmbassadorCodeCard'
import { AmbassadorPointsSummary } from '@/components/ambassadors/AmbassadorPointsSummary'
import { AmbassadorBadges } from '@/components/ambassadors/AmbassadorBadges'
import { AmbassadorRewardsTimeline } from '@/components/ambassadors/AmbassadorRewardsTimeline'
import { AmbassadorMotivationBanner } from '@/components/ambassadors/AmbassadorMotivationBanner'
import { AmbassadorLeaderboard } from '@/components/ambassadors/AmbassadorLeaderboard'
import { AmbassadorRewardsList } from '@/components/ambassadors/AmbassadorRewardsList'
import { AmbassadorBonusTickets } from '@/components/ambassadors/AmbassadorBonusTickets'
import { AmbassadorRecruitsTable } from '@/components/ambassadors/AmbassadorRecruitsTable'
import { AmbassadorConditions } from '@/components/ambassadors/AmbassadorConditions'

interface AmbassadorDashboardProps {
  fullName?: string | null
  email?: string | null
  data: AmbassadorDashboardData
  onRewardClaimed?: () => void | Promise<void>
}

export function AmbassadorDashboard({
  fullName,
  email,
  data,
  onRewardClaimed,
}: AmbassadorDashboardProps) {
  const [copyFeedback, setCopyFeedback] = useState<'idle' | 'copied'>('idle')
  const { claimingLevel, actionError, actionSuccess, handleClaimReward } =
    useClaimAmbassadorReward(onRewardClaimed)

  const totalPoints = data.total_points
  const nextRewardLevel = data.next_reward?.reward_level ?? null
  const segmentFill = getCurrentSegmentFill(totalPoints, nextRewardLevel)
  const latestPointsEvent = data.recruits_table.find((row) => row.points > 0 && row.payment_status === 'paid') ?? null

  const levels = AMBASSADOR_REWARD_LEVELS as unknown as Array<{
    reward_level: number
    reward_name: string
    points_required: number
  }>
  const unlockedLevels = levels.filter((level) => level.points_required <= totalPoints)
  const currentBadgeLevel = unlockedLevels.length > 0 ? unlockedLevels[unlockedLevels.length - 1].reward_level : null
  const nextBadgeLevels = levels.filter((level) => level.points_required > totalPoints).slice(0, 3)

  // Levels locked beyond the next one (for the FOMO teaser)
  const fomoLevels = levels.filter(
    (l) => l.points_required > (data.next_reward?.points_required ?? totalPoints),
  )

  const handleCopy = async () => {
    if (!data.code) return
    try {
      await navigator.clipboard.writeText(data.code)
      setCopyFeedback('copied')
      window.setTimeout(() => setCopyFeedback('idle'), 2000)
    } catch {}
  }

  const handleShare = async () => {
    const text = `Rejoins la prochaine course Overbound avec mon code ambassadeur "${data.code}" pour bénéficier d'une réduction ! 🏅`
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ text })
        return
      } catch {}
    }
    await handleCopy()
  }

  return (
    <main className="min-h-screen bg-background">
      <Container className="space-y-4 py-6 sm:space-y-6 sm:py-8">
        <AmbassadorHero fullName={fullName} email={email} />

        <AmbassadorCodeCard code={data.code} copyFeedback={copyFeedback} onCopy={handleCopy} onShare={handleShare} />

        <AmbassadorPointsSummary
          totalPoints={totalPoints}
          openCount={data.points_breakdown.open_count}
          rankedCount={data.points_breakdown.ranked_count}
          nextReward={data.next_reward}
          segmentFill={segmentFill}
        />

        <AmbassadorMotivationBanner
          nextReward={data.next_reward}
          fomoLevels={fomoLevels}
          latestPointsEvent={latestPointsEvent}
          code={data.code}
          onShare={handleShare}
        />

        <AmbassadorRewardsTimeline levels={levels} totalPoints={totalPoints} nextRewardLevel={nextRewardLevel} />

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-3 lg:items-start">
          <div className="space-y-4 sm:space-y-6 lg:col-span-2">
            <AmbassadorRewardsList
              rewards={data.rewards}
              claimingLevel={claimingLevel}
              actionError={actionError}
              actionSuccess={actionSuccess}
              onClaim={handleClaimReward}
            />
            <AmbassadorBonusTickets
              totalPoints={totalPoints}
              rewards={data.rewards}
              claimingLevel={claimingLevel}
              onClaim={handleClaimReward}
            />
            <AmbassadorRecruitsTable recruits={data.recruits_table} code={data.code} onShare={handleShare} />
          </div>
          <div className="space-y-4 sm:space-y-6">
            <AmbassadorLeaderboard leaderboard={data.leaderboard} />
            <AmbassadorBadges
              unlockedLevels={unlockedLevels}
              currentBadgeLevel={currentBadgeLevel}
              nextBadgeLevels={nextBadgeLevels}
            />
            <AmbassadorConditions />
          </div>
        </div>
      </Container>
    </main>
  )
}
