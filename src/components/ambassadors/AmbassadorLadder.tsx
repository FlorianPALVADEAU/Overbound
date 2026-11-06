import { Check, Lock } from 'lucide-react'
import { Disclosure } from '@/components/ds'
import { Badge } from '@/components/ui/badge'
import { REWARD_STATUS_LABELS, REWARD_STATUS_STYLES, REWARD_KIND_META } from '@/lib/ambassadors/dashboardPresentation'
import type { BonusSummary } from '@/lib/ambassadors/dashboard/goal'
import type { LadderStep } from '@/lib/ambassadors/dashboard/ladder'
import { cn } from '@/lib/utils'

interface AmbassadorLadderProps {
  steps: LadderStep[]
  bonus: BonusSummary | null
  /** Open from the start on phones (a reward is within reach). From lg the list is always shown. */
  defaultOpen?: boolean
}

const STATE_LABELS = { reached: 'Atteint', next: 'Prochain palier', locked: 'Verrouillé' } as const

export function AmbassadorLadder({ steps, bonus, defaultOpen = false }: AmbassadorLadderProps) {
  const reached = steps.filter((step) => step.state === 'reached').length

  return (
    <Disclosure
      title="Les récompenses"
      badge={<Badge variant="outline">{reached} / {steps.length}</Badge>}
      summary="Tous les paliers et ce que tu gagnes"
      defaultOpen={defaultOpen}
    >
      <ol className="space-y-1">
        {steps.map((step) => {
          const Icon = REWARD_KIND_META[step.kind].icon
          return (
            <li
              key={step.level}
              className={cn(
                'flex items-start gap-3 rounded-xl px-3 py-3',
                step.state === 'next' && 'border border-primary/40 bg-primary/10',
                step.state === 'locked' && 'text-muted-foreground',
              )}
            >
              <span className="sr-only">{STATE_LABELS[step.state]} : </span>
              <span aria-hidden className="mt-0.5 shrink-0">
                {step.state === 'reached' ? <Check className="size-5 text-success" /> : step.state === 'next' ? <Icon className="size-5 text-primary" /> : <Lock className="size-5" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className={cn('font-semibold', step.state === 'reached' ? 'text-foreground' : undefined)}>{step.name}</p>
                {step.state === 'next' ? <p className="mt-0.5 text-sm text-muted-foreground">{step.description}</p> : null}
                {step.rewardExpired ? (
                  <Badge className="mt-1" variant="outline">Expirée</Badge>
                ) : step.rewardStatus && step.rewardStatus !== 'earned' ? (
                  <Badge className={cn('mt-1', REWARD_STATUS_STYLES[step.rewardStatus])}>{REWARD_STATUS_LABELS[step.rewardStatus]}</Badge>
                ) : null}
              </div>
              <p className="shrink-0 text-sm font-semibold tabular-nums">{step.pointsRequired} pts</p>
            </li>
          )
        })}
      </ol>

      {bonus ? (
        <div className="mt-4 rounded-xl border border-border bg-muted/40 px-3 py-3 text-sm">
          <p className="font-semibold">Ensuite : {bonus.name.toLowerCase()} tous les {bonus.intervalPoints} points</p>
          <p className="mt-1 text-muted-foreground">
            {bonus.earned > 0
              ? `${bonus.earned} gagné${bonus.earned > 1 ? 's' : ''}. Prochain à ${bonus.nextAt} pts. Pas de plafond.`
              : 'Pas de plafond, plus tu recrutes plus tu gagnes.'}
          </p>
        </div>
      ) : null}
    </Disclosure>
  )
}
