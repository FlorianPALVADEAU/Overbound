'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { AdminAmbassadorSheetResponse, AdminLadderStep, AdminSheetReward } from '@/lib/admin/ambassadors/types'
import { cn } from '@/lib/utils'
import type { useRewardActions } from '../useRewardActions'
import { formatDateTime, formatPoints, REWARD_STATUS_LABELS, REWARD_STATUS_STYLES, SETTABLE_REWARD_STATUSES } from '../rewardStatus'

type RewardActions = ReturnType<typeof useRewardActions>

/** Phone: 44 px touch targets (design system rule), back to the compact size from sm. */
const ACTION_TOUCH = 'min-h-11 sm:min-h-8'

interface AmbassadorRewardsPanelProps {
  sheet: AdminAmbassadorSheetResponse
  actions: RewardActions
}

/** Every step of the season's ladder with its reward, then the bonus bibs. Each reward carries its own actions. */
export function AmbassadorRewardsPanel({ sheet, actions }: AmbassadorRewardsPanelProps) {
  const totalPoints = sheet.season.total_points
  const { bonus } = sheet

  return (
    <div className="grid gap-8">
      <section aria-label="Paliers de la saison" className="grid gap-3">
        <h3 className="text-label font-semibold uppercase text-subtle">Paliers</h3>
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border">
          {sheet.ladder.map((step) => (
            <LadderRow key={step.level} step={step} totalPoints={totalPoints} actions={actions} />
          ))}
        </ul>
      </section>

      <section aria-label="Dossards bonus" className="grid gap-3">
        <h3 className="text-label font-semibold uppercase text-subtle">Dossards bonus</h3>
        {sheet.bonus_rewards.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucun dossard bonus pour l’instant.
            {bonus ? ` Le prochain arrive à ${bonus.next_points_required} pts.` : ''}
          </p>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border">
            {sheet.bonus_rewards.map((reward) => (
              <li key={reward.id} className="p-3">
                <RewardRow reward={reward} title={`Palier ${reward.reward_level} · ${reward.reward_name}`} actions={actions} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function LadderRow({ step, totalPoints, actions }: { step: AdminLadderStep; totalPoints: number; actions: RewardActions }) {
  const missing = step.points_required - totalPoints
  const title = `Palier ${step.level} · ${step.name}`

  if (step.reward) {
    return (
      <li className="p-3">
        <RewardRow reward={step.reward} title={title} points={step.points_required} actions={actions} />
      </li>
    )
  }

  return (
    <li className={cn('flex flex-col gap-1 p-3 sm:flex-row sm:items-center sm:justify-between', step.state === 'locked' && 'text-muted-foreground')}>
      <div className="min-w-0">
        <p className="font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground">{formatPoints(step.points_required)}</p>
      </div>
      <p className="text-xs text-muted-foreground">{step.state === 'reached' ? 'Pas encore de récompense' : `Il manque ${formatPoints(missing)}`}</p>
    </li>
  )
}

function RewardRow({
  reward,
  title,
  points,
  actions,
}: {
  reward: AdminSheetReward
  title: string
  points?: number
  actions: RewardActions
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 space-y-1">
        <p className="font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground">
          {points !== undefined ? `${formatPoints(points)} · ` : ''}Gagnée le {formatDateTime(reward.earned_at)} · {expiry(reward)}
        </p>
        {reward.claimed_at ? <p className="text-xs text-muted-foreground">Réclamée le {formatDateTime(reward.claimed_at)}</p> : null}
        {reward.fulfilled_at ? <p className="text-xs text-muted-foreground">Envoyée le {formatDateTime(reward.fulfilled_at)}</p> : null}
        {reward.cancellation_reason ? <p className="text-xs text-muted-foreground">Motif : {reward.cancellation_reason}</p> : null}
      </div>
      <div className="flex flex-col gap-2 sm:items-end">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className={REWARD_STATUS_STYLES[reward.status]}>{REWARD_STATUS_LABELS[reward.status]}</Badge>
          {reward.is_expired && reward.status === 'earned' ? <Badge variant="outline">Expirée</Badge> : null}
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
          {reward.status === 'earned' ? (
            <Button type="button" size="sm" className={ACTION_TOUCH} disabled={actions.pending} onClick={() => void actions.setStatus(reward.id, 'claimed')}>
              Marquer réclamée
            </Button>
          ) : null}
          {reward.status === 'claimed' ? (
            <Button type="button" size="sm" className={ACTION_TOUCH} disabled={actions.pending} onClick={() => void actions.setStatus(reward.id, 'fulfilled')}>
              Marquer envoyée
            </Button>
          ) : null}
          {reward.status === 'cancelled' ? (
            <Button type="button" size="sm" variant="outline" className={ACTION_TOUCH} disabled={actions.pending} onClick={() => actions.askTransition(reward.id, 'reopened')}>
              Rouvrir
            </Button>
          ) : (
            <>
              <Button type="button" size="sm" variant="outline" className={ACTION_TOUCH} disabled={actions.pending} onClick={() => actions.askTransition(reward.id, 'cancelled')}>
                Annuler
              </Button>
              <StatusSelect reward={reward} disabled={actions.pending} onChange={(status) => void actions.setStatus(reward.id, status)} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function StatusSelect({
  reward,
  disabled,
  onChange,
}: {
  reward: AdminSheetReward
  disabled: boolean
  onChange: (status: (typeof SETTABLE_REWARD_STATUSES)[number]) => void
}) {
  const isSettable = (value: string): value is (typeof SETTABLE_REWARD_STATUSES)[number] =>
    SETTABLE_REWARD_STATUSES.some((status) => status === value)

  return (
    <Select value={reward.status} onValueChange={(value) => isSettable(value) && onChange(value)} disabled={disabled}>
      <SelectTrigger size="sm" className={cn('col-span-2 w-full sm:w-36', ACTION_TOUCH)} aria-label={`Statut de la récompense ${reward.reward_name}`}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {SETTABLE_REWARD_STATUSES.map((status) => (
          <SelectItem key={status} value={status}>{REWARD_STATUS_LABELS[status]}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

const expiry = (reward: AdminSheetReward) => (reward.expires_at ? `expire le ${formatDateTime(reward.expires_at)}` : 'sans expiration')
