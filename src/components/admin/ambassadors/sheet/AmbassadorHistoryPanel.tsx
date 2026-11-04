'use client'

import { useAdminAmbassadorHistory } from '@/app/api/admin/ambassadors/ambassadorsQueries'
import type { AdminPointsAdjustmentEvent, AdminRewardDecisionEvent } from '@/lib/admin/ambassadors/types'
import { formatDateTime } from '../rewardStatus'

/** Corrections and decisions made by hand, newest first. Nothing here is edited or deleted: it is the audit trail. */
export function AmbassadorHistoryPanel({ ambassadorId }: { ambassadorId: string }) {
  const { data, isLoading, error } = useAdminAmbassadorHistory(ambassadorId)

  if (isLoading) return <p className="text-sm text-muted-foreground">Chargement…</p>
  if (error) return <p className="text-sm text-destructive" role="alert">{error.message}</p>

  const adjustments = data?.point_adjustments ?? []
  const decisions = data?.reward_decisions ?? []

  return (
    <div className="grid gap-8">
      <section aria-label="Corrections de points" className="grid gap-3">
        <h3 className="text-label font-semibold uppercase text-subtle">Corrections de points</h3>
        {adjustments.length === 0 ? <p className="text-sm text-muted-foreground">Aucune correction manuelle.</p> : (
          <ul className="grid gap-2">{adjustments.map((event) => <AdjustmentItem key={event.id} event={event} />)}</ul>
        )}
      </section>

      <section aria-label="Décisions sur les récompenses" className="grid gap-3">
        <h3 className="text-label font-semibold uppercase text-subtle">Récompenses annulées ou rouvertes</h3>
        {decisions.length === 0 ? <p className="text-sm text-muted-foreground">Aucune décision enregistrée.</p> : (
          <ul className="grid gap-2">{decisions.map((event) => <DecisionItem key={`${event.reward_id}-${event.occurred_at}`} event={event} />)}</ul>
        )}
      </section>
    </div>
  )
}

function AdjustmentItem({ event }: { event: AdminPointsAdjustmentEvent }) {
  return (
    <li className="grid gap-1 rounded-xl border p-3 text-sm">
      <p className="font-medium">
        Saison {event.program_year} · {event.before_total_points} → {event.after_total_points} pts
        <span className="text-muted-foreground"> (Open {event.before_recruits_open} → {event.after_recruits_open}, Ranked {event.before_recruits_ranked} → {event.after_recruits_ranked})</span>
      </p>
      <p>{event.reason}</p>
      <p className="text-xs text-muted-foreground">{formatDateTime(event.created_at)} · {event.actor_name ?? 'Équipe'}</p>
    </li>
  )
}

function DecisionItem({ event }: { event: AdminRewardDecisionEvent }) {
  const verb = event.action === 'cancelled' ? 'Récompense annulée' : 'Récompense rouverte'
  const reward = event.reward_name ? `${event.reward_name}${event.reward_level ? ` (palier ${event.reward_level})` : ''}` : 'Récompense'
  return (
    <li className="grid gap-1 rounded-xl border p-3 text-sm">
      <p className="font-medium">{verb} · {reward}{event.program_year ? ` · saison ${event.program_year}` : ''}</p>
      <p>{event.reason}</p>
      <p className="text-xs text-muted-foreground">{formatDateTime(event.occurred_at)} · {event.actor_name ?? 'Équipe'}</p>
    </li>
  )
}
