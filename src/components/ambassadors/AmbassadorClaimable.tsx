import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Eyebrow } from '@/components/ds'
import { formatAmbassadorLongDate, REWARD_KIND_META } from '@/lib/ambassadors/dashboardPresentation'
import type { AmbassadorReward } from '@/types/Ambassador'

interface AmbassadorClaimableProps {
  rewards: AmbassadorReward[]
  claimingLevel: number | null
  error: string | null
  success: string | null
  onClaim: (rewardLevel: number) => void
}

/** Rewards won and not yet claimed. Rendered only when there is something to claim or to say. */
export function AmbassadorClaimable({ rewards, claimingLevel, error, success, onClaim }: AmbassadorClaimableProps) {
  if (rewards.length === 0 && !error && !success) return null

  return (
    <Card variant="photo" className="gap-0 py-0">
      <CardContent className="space-y-4 p-4 sm:p-6">
        {rewards.length > 0 ? (
          <>
            <Eyebrow>{rewards.length > 1 ? 'À réclamer' : 'À réclamer maintenant'}</Eyebrow>
            <ul className="space-y-3">
              {rewards.map((reward) => {
                const Icon = REWARD_KIND_META[reward.kind].icon
                return (
                  <li key={reward.id} className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <Icon aria-hidden className="mt-0.5 size-5 shrink-0 text-primary" />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">{reward.reward_name}</p>
                        {reward.expires_at ? (
                          <p className="text-xs text-muted-foreground">À réclamer avant le {formatAmbassadorLongDate(reward.expires_at)}</p>
                        ) : null}
                      </div>
                    </div>
                    <Button size="cta" className="w-full shrink-0 px-6 sm:w-auto" disabled={claimingLevel !== null} onClick={() => onClaim(reward.reward_level)}>
                      {claimingLevel === reward.reward_level ? 'Envoi...' : 'Réclamer'}
                    </Button>
                  </li>
                )
              })}
            </ul>
          </>
        ) : null}
        {success ? <p className="text-sm font-medium text-success">{success}</p> : null}
        {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}
      </CardContent>
    </Card>
  )
}
