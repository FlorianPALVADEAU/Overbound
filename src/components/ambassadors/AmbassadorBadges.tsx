'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

export function AmbassadorBadges({ unlockedLevels, currentBadgeLevel, nextBadgeLevels }: AmbassadorBadgesProps) {
  return (
    <Card className="border-border/60">
      <CardHeader className="pb-2 pt-5">
        <CardTitle className="flex items-center gap-2 text-base">
          <Medal className="h-4 w-4" />
          Badges ambassadeur
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentBadgeLevel ? (
          <div className="rounded-lg border border-primary/25 bg-primary/5 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Badge actuel</p>
            <div className="mt-1 flex items-center gap-2">
              <Badge className={cn(BADGE_META[currentBadgeLevel]?.colorClass)}>
                {BADGE_META[currentBadgeLevel]?.label ?? `Badge palier ${currentBadgeLevel}`}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Palier {currentBadgeLevel}
              </span>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-border/50 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            Aucun badge débloqué pour l’instant. Premier badge à 1 point.
          </div>
        )}

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {unlockedLevels.map((level) => {
            const meta = BADGE_META[level.reward_level]
            const Icon = TIER_META[level.reward_level]?.icon ?? Medal
            return (
              <div key={level.reward_level} className="rounded-lg border border-border/60 px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <Badge className={cn(meta?.colorClass)}>{meta?.label ?? `Badge palier ${level.reward_level}`}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Débloqué à {level.points_required} pts
                </p>
              </div>
            )
          })}
        </div>

        {nextBadgeLevels.length > 0 && (
          <div className="rounded-lg border border-border/50 bg-muted/20 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Prochains badges</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {nextBadgeLevels.map((level) => (
                <Badge key={level.reward_level} variant="outline" className="text-xs text-muted-foreground">
                  {BADGE_META[level.reward_level]?.label ?? `Badge palier ${level.reward_level}`} · {level.points_required} pts
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
