import type { AmbassadorPaymentStatus, AmbassadorPointsStatus, AmbassadorRaceFormat, AmbassadorRewardStatus } from '@/types/Ambassador'

export const REWARD_STATUS_LABELS: Record<AmbassadorRewardStatus, string> = {
  earned: 'Débloquée',
  claimed: 'Réclamée',
  fulfilled: 'Envoyée',
  cancelled: 'Annulée',
}

export const REWARD_STATUS_STYLES: Record<AmbassadorRewardStatus, string> = {
  earned: 'border-success/40 bg-success/20 text-success',
  claimed: 'border-warning/40 bg-warning/20 text-warning',
  fulfilled: 'border-info/40 bg-info/20 text-info',
  cancelled: 'border-destructive/40 bg-destructive/20 text-destructive',
}

/** Statuses an admin sets by hand. Cancelling and reopening go through a reason, never through this list. */
export const SETTABLE_REWARD_STATUSES = ['earned', 'claimed', 'fulfilled'] as const satisfies readonly AmbassadorRewardStatus[]

export const PAYMENT_STATUS_LABELS: Record<AmbassadorPaymentStatus, string> = {
  paid: 'Payée',
  pending: 'En attente',
  refunded: 'Remboursée',
  cancelled: 'Annulée',
}

export const POINTS_STATUS_LABELS: Record<AmbassadorPointsStatus, string> = {
  counted: 'Crédités',
  revoked: 'Retirés',
  none: 'Aucun',
}

export const RACE_FORMAT_LABELS: Record<AmbassadorRaceFormat, string> = {
  open: 'Open',
  ranked: 'Ranked',
}

export const formatDateTime = (value: string | null) =>
  value ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Paris' }).format(new Date(value)) : '—'

export const formatPoints = (value: number) => `${value} pt${value > 1 ? 's' : ''}`

/** Message of a failed mutation: the API's `error` when it sent one. */
export function mutationMessage(error: unknown, fallback: string): string {
  const apiMessage = (error as { response?: { data?: { error?: unknown } } } | null)?.response?.data?.error
  if (typeof apiMessage === 'string' && apiMessage) return apiMessage
  return error instanceof Error && error.message ? error.message : fallback
}
