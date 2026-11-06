import { Card, CardContent } from '@/components/ui/card'
import { Eyebrow } from '@/components/ds'
import { formatAmbassadorLongDate } from '@/lib/ambassadors/dashboardPresentation'
import type { AmbassadorGoal } from '@/lib/ambassadors/dashboard/goal'

interface AmbassadorGoalCardProps {
  goal: AmbassadorGoal | null
  totalPoints: number
  openCount: number
  rankedCount: number
  /** Points gained since the last visit, 0 when none or unknown. */
  pointsSinceLastVisit: number
  seasonEndsAt: string | null
}

/** Non-breaking space: the unit never wraps alone on a line. */
const plural = (count: number, one: string, many: string) => `${count}\u00a0${count > 1 ? many : one}`

export function AmbassadorGoalCard({ goal, totalPoints, openCount, rankedCount, pointsSinceLastVisit, seasonEndsAt }: AmbassadorGoalCardProps) {
  return (
    <Card variant="feature" className="gap-0 py-0">
      <CardContent className="space-y-6 p-4 sm:p-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-label font-semibold uppercase text-subtle">Mes points</p>
            <p className="font-display text-display-lg font-bold uppercase leading-none text-foreground">{totalPoints}</p>
          </div>
          <dl className="flex gap-6 text-right">
            <div>
              <dt className="text-label font-semibold uppercase text-subtle">Open</dt>
              <dd className="font-display text-title font-bold">{openCount}</dd>
            </div>
            <div>
              <dt className="text-label font-semibold uppercase text-subtle">Ranked</dt>
              <dd className="font-display text-title font-bold">{rankedCount}</dd>
            </div>
          </dl>
        </div>

        {pointsSinceLastVisit > 0 ? (
          <p className="rounded-xl border border-success/40 bg-success/10 px-3 py-2 text-sm font-medium text-success motion-safe:animate-in motion-safe:fade-in">
            +{plural(pointsSinceLastVisit, 'point', 'points')} depuis ta dernière visite
          </p>
        ) : null}

        {goal ? (
          <div className="space-y-3">
            <div>
              <Eyebrow>{goal.isBonus ? 'Prochain dossard bonus' : 'Prochain palier'}</Eyebrow>
              <p className="mt-1 text-title font-semibold">{goal.name}</p>
              {goal.description ? <p className="mt-1 text-sm text-muted-foreground">{goal.description}</p> : null}
            </div>
            <div
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={goal.progressPercent}
              aria-label={`Progression vers ${goal.name}`}
              className="h-3 overflow-hidden rounded-full bg-muted"
            >
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-300 ease-standard"
                style={{ width: `${goal.progressPercent}%` }}
              />
            </div>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <p className="font-semibold">Encore {plural(goal.pointsRemaining, 'point', 'points')}</p>
              <p className="text-muted-foreground">{goal.pointsRequired} pts</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Soit {plural(goal.friendsNeeded.open, 'ami', 'amis')} en Open, ou {plural(goal.friendsNeeded.ranked, 'ami', 'amis')} en Ranked.
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Tous les paliers sont débloqués.</p>
        )}

        {seasonEndsAt ? (
          <p className="border-t border-border pt-4 text-xs text-muted-foreground">
            Saison en cours jusqu&apos;au {formatAmbassadorLongDate(seasonEndsAt)}. Les récompenses non réclamées à cette date expirent.
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
