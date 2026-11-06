'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { AmbassadorDashboardData } from '@/types/Ambassador'
import { buildBonusSummary, buildGoal } from '@/lib/ambassadors/dashboard/goal'
import { buildLadder, getClaimableRewards } from '@/lib/ambassadors/dashboard/ladder'
import { buildReferralUrl } from '@/lib/attribution/referral'
import { useClaimAmbassadorReward } from '@/hooks/ambassadors/useClaimAmbassadorReward'
import { usePointsSinceLastVisit } from '@/hooks/ambassadors/usePointsSinceLastVisit'
import { Container, DISPLAY_TITLE, Eyebrow, Pill } from '@/components/ds'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { AmbassadorGoalCard } from '@/components/ambassadors/AmbassadorGoalCard'
import { AmbassadorShareCard } from '@/components/ambassadors/AmbassadorShareCard'
import { AmbassadorPublicCard } from '@/components/ambassadors/AmbassadorPublicCard'
import { AmbassadorClaimable } from '@/components/ambassadors/AmbassadorClaimable'
import { AmbassadorLadder } from '@/components/ambassadors/AmbassadorLadder'
import { AmbassadorLeaderboard } from '@/components/ambassadors/AmbassadorLeaderboard'
import { AmbassadorActivity } from '@/components/ambassadors/AmbassadorActivity'
import { AmbassadorPreviousEdition } from '@/components/ambassadors/AmbassadorPreviousEdition'
import { AmbassadorRules } from '@/components/ambassadors/AmbassadorRules'

interface AmbassadorDashboardProps {
  fullName?: string | null
  email?: string | null
  avatarUrl?: string | null
  data: AmbassadorDashboardData
  /** An admin looking at someone else's dashboard: nothing is stored in the browser. */
  adminView?: boolean
  onRewardClaimed?: () => void | Promise<void>
}

const NEAR_POINTS = 2

const firstNameOf = (fullName?: string | null, email?: string | null) =>
  fullName?.trim().split(/\s+/)[0] || email?.split('@')[0] || 'Ambassadeur'

export function AmbassadorDashboard({ fullName, email, avatarUrl, data, adminView = false, onRewardClaimed }: AmbassadorDashboardProps) {
  const [copied, setCopied] = useState(false)
  const [copyFailed, setCopyFailed] = useState(false)
  const { claimingLevel, actionError, actionSuccess, handleClaimReward } = useClaimAmbassadorReward(onRewardClaimed)
  const pointsSinceLastVisit = usePointsSinceLastVisit(data.total_points, !adminView)

  const goal = buildGoal(data.program, data.total_points)
  const steps = buildLadder(data.program, data.total_points, data.rewards)
  const bonus = buildBonusSummary(data.program, data.total_points)
  const claimable = getClaimableRewards(data.rewards)
  const rank = data.leaderboard.current_user_rank
  // Ladder and ranking fold on phones; they open by themselves when a reward or a rival is within two points.
  const rewardIsClose = goal !== null && goal.pointsRemaining <= NEAR_POINTS
  const rivalIsClose = data.leaderboard.chase !== null && data.leaderboard.chase.points_to_pass <= NEAR_POINTS

  const handleCopy = async () => {
    if (!data.code) return
    try {
      await navigator.clipboard.writeText(data.code)
      setCopyFailed(false)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard access can be refused: the code stays on screen and the user is told how to copy it.
      setCopied(false)
      setCopyFailed(true)
    }
  }

  const handleShare = async () => {
    if (!data.code) return
    const url = buildReferralUrl(window.location.origin, data.code, data.open_event_slug)
    const text = `Je cours avec Overbound. Mon code ${data.code} te donne une réduction, il s'applique tout seul avec ce lien.`
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ text, url })
        return
      } catch {
        // Share sheet dismissed: fall back to copying the code.
      }
    }
    await handleCopy()
  }

  return (
    <main className="min-h-screen bg-background">
      <Container size="page" className="space-y-4 py-6 sm:space-y-6 sm:py-8">
        <header className="space-y-3">
          <div className="min-w-0">
            <Eyebrow>Espace ambassadeur</Eyebrow>
            <h1 className={cn(DISPLAY_TITLE, 'mt-2 text-display-md')}>Salut {firstNameOf(fullName, email)}</h1>
          </div>
          <div className="flex items-center justify-between gap-3">
            {rank ? <Pill variant="tag">{rank}e au classement</Pill> : <span />}
            <Button asChild variant="ghost" className="h-11">
              <Link href="/account">Mon compte</Link>
            </Button>
          </div>
        </header>

        <AmbassadorClaimable
          rewards={claimable}
          claimingLevel={claimingLevel}
          error={actionError}
          success={actionSuccess}
          onClaim={handleClaimReward}
        />

        {/* Mobile: the code comes first, the goal second. From lg: goal left, code right. */}
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2 lg:items-start">
          <div className="order-2 lg:order-none">
            <AmbassadorGoalCard
              goal={goal}
              totalPoints={data.total_points}
              openCount={data.points_breakdown.open_count}
              rankedCount={data.points_breakdown.ranked_count}
              pointsSinceLastVisit={pointsSinceLastVisit}
              seasonEndsAt={data.season_ends_at}
            />
          </div>
          <div className="order-1 lg:order-none">
            <AmbassadorShareCard code={data.code} copied={copied} copyFailed={copyFailed} onCopy={handleCopy} onShare={handleShare} />
          </div>
        </div>

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2 lg:items-start">
          {adminView ? null : <AmbassadorPublicCard fullName={fullName} email={email} avatarUrl={avatarUrl} />}
          <AmbassadorLadder steps={steps} bonus={bonus} defaultOpen={rewardIsClose} />
          <AmbassadorLeaderboard leaderboard={data.leaderboard} defaultOpen={rivalIsClose} />
          <AmbassadorActivity recruits={data.recruits_table} onShare={handleShare} />
          {data.previous_edition ? <AmbassadorPreviousEdition edition={data.previous_edition} /> : null}
          <AmbassadorRules seasonEndsAt={data.season_ends_at} />
        </div>
      </Container>
    </main>
  )
}
