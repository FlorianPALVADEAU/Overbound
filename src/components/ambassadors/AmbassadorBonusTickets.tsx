'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Ticket } from 'lucide-react'
import {
  REWARD_STATUS_LABELS,
  REWARD_STATUS_STYLES,
  formatAmbassadorDate,
} from '@/lib/ambassadors/dashboardPresentation'
import {
  EXTRA_TICKET_BASE_POINTS,
  EXTRA_TICKET_INTERVAL,
  getExtraTicketsEarned,
  getNextExtraTicketPointsRequired,
} from '@/lib/ambassadors/program'
import type { AmbassadorReward } from '@/types/Ambassador'

interface AmbassadorBonusTicketsProps {
  totalPoints: number
  rewards: AmbassadorReward[]
  claimingLevel: number | null
  onClaim: (rewardLevel: number) => void
}

export function AmbassadorBonusTickets({
  totalPoints,
  rewards,
  claimingLevel,
  onClaim,
}: AmbassadorBonusTicketsProps) {
  const extraEarned = getExtraTicketsEarned(totalPoints)
  const extraRewards = rewards.filter((r) => r.reward_level >= 11)
  const claimableCount = extraRewards.filter((r) => r.status === 'earned').length
  const claimedCount = extraRewards.filter((r) => r.status !== 'earned').length
  const nextRequired = getNextExtraTicketPointsRequired(totalPoints)
  const ptsToNext = nextRequired - totalPoints
  const isUnlocked = totalPoints > EXTRA_TICKET_BASE_POINTS
  const fillPct = isUnlocked
    ? Math.min(100, Math.max(0, (((totalPoints - EXTRA_TICKET_BASE_POINTS) % EXTRA_TICKET_INTERVAL) / EXTRA_TICKET_INTERVAL) * 100))
    : Math.min(100, (totalPoints / EXTRA_TICKET_BASE_POINTS) * 100)

  return (
    <Card className={cn('border-border/60', isUnlocked && extraEarned > 0 && 'border-primary/25')}>
      <CardHeader className="pb-3 pt-5">
        <CardTitle className="flex items-center gap-2 text-base">
          <Ticket className="h-4 w-4" />
          Dossards bonus
          {extraEarned > 0 && <Badge variant="secondary">{extraEarned}</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-border/50 bg-muted/20 p-3 text-sm text-muted-foreground">
          Au-delà de {EXTRA_TICKET_BASE_POINTS} points, chaque tranche de{' '}
          <span className="font-semibold text-foreground">{EXTRA_TICKET_INTERVAL} points</span> te
          rapporte <span className="font-semibold text-foreground">1 dossard offert</span>.
        </div>

        {!isUnlocked ? (
          <div className="space-y-2">
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>{totalPoints} pts</span>
              <span className="font-bold text-primary">encore {EXTRA_TICKET_BASE_POINTS - totalPoints} pt{EXTRA_TICKET_BASE_POINTS - totalPoints > 1 ? 's' : ''} pour débloquer</span>
              <span>{EXTRA_TICKET_BASE_POINTS} pts</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary/40 transition-all duration-700" style={{ width: `${fillPct}%` }} />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-4 text-sm">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span><span className="font-bold">{extraEarned}</span> dossard{extraEarned > 1 ? 's' : ''} gagné{extraEarned > 1 ? 's' : ''}</span>
              </span>
              {claimedCount > 0 && (
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-sky-500" />
                  <span><span className="font-bold">{claimedCount}</span> réclamé{claimedCount > 1 ? 's' : ''}</span>
                </span>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>{totalPoints} pts</span>
                <span className="font-bold text-primary">encore {ptsToNext} pt{ptsToNext > 1 ? 's' : ''} pour le prochain</span>
                <span>{nextRequired} pts</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${fillPct}%` }} />
              </div>
            </div>

            {claimableCount > 0 && (
              <div className="space-y-2">
                {extraRewards
                  .filter((r) => r.status === 'earned')
                  .map((reward, i) => (
                    <div
                      key={reward.id}
                      className="flex items-center justify-between rounded-lg border border-primary/25 bg-primary/5 px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <Ticket className="h-4 w-4 text-primary" />
                        <div>
                          <p className="text-sm font-semibold">Dossard #{i + 1 + claimedCount}</p>
                          <p className="text-xs text-muted-foreground">Débloqué le {formatAmbassadorDate(reward.earned_at)}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => onClaim(reward.reward_level)}
                        disabled={claimingLevel === reward.reward_level}
                      >
                        {claimingLevel === reward.reward_level ? 'Envoi…' : 'Réclamer'}
                      </Button>
                    </div>
                  ))}
              </div>
            )}

            {claimedCount > 0 && (
              <div className="space-y-2">
                {extraRewards
                  .filter((r) => r.status !== 'earned')
                  .map((reward, i) => (
                    <div
                      key={reward.id}
                      className="flex items-center justify-between rounded-lg border border-border/40 bg-muted/20 px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <Ticket className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Dossard #{i + 1}</p>
                          <p className="text-xs text-muted-foreground">
                            {reward.claimed_at ? `Réclamé le ${formatAmbassadorDate(reward.claimed_at)}` : 'Traitement en cours'}
                          </p>
                        </div>
                      </div>
                      <Badge className={REWARD_STATUS_STYLES[reward.status]}>
                        {REWARD_STATUS_LABELS[reward.status]}
                      </Badge>
                    </div>
                  ))}
              </div>
            )}

            {claimableCount === 0 && claimedCount === 0 && extraEarned === 0 && (
              <p className="text-sm text-muted-foreground">Aucun dossard bonus débloqué pour l&apos;instant.</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
