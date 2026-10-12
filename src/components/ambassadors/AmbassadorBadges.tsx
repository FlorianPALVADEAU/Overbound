'use client'

import { Badge } from '@/components/ui/badge'
import { Disclosure } from '@/components/ds'
import { cn } from '@/lib/utils'
import { Medal } from 'lucide-react'
import { BADGE_META, TIER_META } from '@/lib/ambassadors/dashboardPresentation'

interface AmbassadorRewardLevel {
  reward_level: number
  reward_name: string
  points_required: number
}

interface AmbassadorBadgesProps {
  unlockedLevels: AmbassadorRewardLevel[]
  currentBadgeLevel: number | null
  nextBadgeLevels: AmbassadorRewardLevel[]
}

const badgeLabel = (level: number) => BADGE_META[level]?.label ?? `Badge palier ${level}`

export function AmbassadorBadges({ unlockedLevels, currentBadgeLevel, nextBadgeLevels }: AmbassadorBadgesProps) {
  return (
    <Disclosure
      icon={<Medal className="size-4" />}
      title="Badges ambassadeur"
      badge={unlockedLevels.length > 0 ? <Badge variant="secondary">{unlockedLevels.length}</Badge> : null}
      summary={currentBadgeLevel ? badgeLabel(currentBadgeLevel) : 'Premier badge à 1 point'}
    >
      <div className="space-y-4">
        {unlockedLevels.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun badge débloqué pour l’instant. Premier badge à 1 point.</p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {unlockedLevels.map((level) => {
              const Icon = TIER_META[level.reward_level]?.icon ?? Medal
              return (
                <li key={level.reward_level} className="flex items-center gap-3 rounded-xl border border-border px-3 py-2">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="size-4" />
                  </span>
                  <span className="min-w-0">
                    <Badge className={cn(BADGE_META[level.reward_level]?.colorClass)}>{badgeLabel(level.reward_level)}</Badge>
                    <span className="mt-0.5 block text-xs text-muted-foreground">Débloqué à {level.points_required} pts</span>
                  </span>
                </li>
              )
            })}
          </ul>
        )}

        {nextBadgeLevels.length > 0 ? (
          <div>
            <p className="text-label font-semibold uppercase text-subtle">Prochains badges</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {nextBadgeLevels.map((level) => (
                <Badge key={level.reward_level} variant="outline" className="text-muted-foreground">
                  {badgeLabel(level.reward_level)} · {level.points_required} pts
                </Badge>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </Disclosure>
  )
}
