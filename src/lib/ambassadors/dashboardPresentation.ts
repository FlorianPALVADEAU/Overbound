import {
  Crown,
  Gift,
  Lock,
  Medal,
  Shield,
  Shirt,
  Star,
  Ticket,
  Trophy,
  Zap,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type {
  AmbassadorPaymentStatus,
  AmbassadorRaceFormat,
  AmbassadorRewardStatus,
} from '@/types/Ambassador'
import { AMBASSADOR_REWARD_LEVELS } from '@/lib/ambassadors/program'

// ─── Tier metadata ─────────────────────────────────────────────────────────────

export const TIER_META: Record<number, { icon: LucideIcon; description: string }> = {
  1: { icon: Medal, description: 'Badge ambassadeur et accès au classement.' },
  2: { icon: Gift, description: 'Récompense starter pour maintenir la motivation.' },
  3: { icon: Gift, description: 'Palier psychologique clé: -50% sur un dossard, utilisable immédiatement.' },
  4: { icon: Trophy, description: 'Premier vrai dossard offert: format Open.' },
  5: { icon: Crown, description: 'Upgrade VIP avec avantages exclusifs le jour J.' },
  6: { icon: Shirt, description: 'T-shirt ambassadeur ou mise en avant réseau.' },
  7: { icon: Shield, description: 'Statut confirmé avec perks dédiés.' },
  8: { icon: Star, description: 'Niveau élite: remboursement total.' },
  9: { icon: Ticket, description: 'Dossard offert pour l’édition suivante.' },
  10: { icon: Crown, description: 'Statut ambassadeur officiel premium.' },
}

export const BADGE_META: Record<number, { label: string; colorClass: string }> = {
  1: { label: 'Badge Starter', colorClass: 'border-success/40 bg-success/10 text-success' },
  2: { label: 'Badge Relayeur', colorClass: 'border-info/40 bg-info/10 text-info' },
  3: { label: 'Badge Booster', colorClass: 'border-warning/40 bg-warning/10 text-warning' },
  4: { label: 'Badge Open Hero', colorClass: 'border-info/40 bg-info/10 text-info' },
  5: { label: 'Badge VIP', colorClass: 'border-primary/40 bg-primary/10 text-primary' },
  6: { label: 'Badge Communauté', colorClass: 'border-warning/40 bg-warning/10 text-warning' },
  7: { label: 'Badge Confirmé', colorClass: 'border-info/40 bg-info/10 text-info' },
  8: { label: 'Badge Elite', colorClass: 'border-destructive/40 bg-destructive/10 text-destructive' },
  9: { label: 'Badge Légende', colorClass: 'border-primary/40 bg-primary/10 text-primary' },
  10: { label: 'Badge Officiel', colorClass: 'border-primary/50 bg-primary/10 text-primary' },
}

// ─── Label maps ────────────────────────────────────────────────────────────────

export const PAYMENT_STATUS_LABELS: Record<AmbassadorPaymentStatus, string> = {
  paid: 'Payé',
  pending: 'En attente',
  refunded: 'Remboursé',
  cancelled: 'Annulé',
}

export const PAYMENT_STATUS_STYLES: Record<AmbassadorPaymentStatus, string> = {
  paid: 'border-success/40 bg-success/10 text-success',
  pending: 'border-warning/40 bg-warning/10 text-warning',
  refunded: 'border-info/40 bg-info/10 text-info',
  cancelled: 'border-destructive/40 bg-destructive/10 text-destructive',
}

export const REWARD_STATUS_LABELS: Record<AmbassadorRewardStatus, string> = {
  earned: 'Débloquée',
  claimed: 'Réclamée',
  fulfilled: 'Remise',
  cancelled: 'Annulée',
}

export const REWARD_STATUS_STYLES: Record<AmbassadorRewardStatus, string> = {
  earned: 'border-success/40 bg-success/10 text-success',
  claimed: 'border-warning/40 bg-warning/10 text-warning',
  fulfilled: 'border-info/40 bg-info/10 text-info',
  cancelled: 'border-destructive/40 bg-destructive/10 text-destructive',
}

export const FORMAT_LABELS: Record<AmbassadorRaceFormat, string> = { open: 'Open', ranked: 'Ranked' }

export const formatAmbassadorDate = (value: string | null | undefined) =>
  value ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short' }).format(new Date(value)) : '—'

// ─── Timeline helpers ──────────────────────────────────────────────────────────

export type AmbassadorTierState = 'unlocked' | 'current' | 'locked'

export function getTierState(
  pointsRequired: number,
  totalPoints: number,
  nextRewardLevel: number | null,
  rewardLevel: number,
): AmbassadorTierState {
  if (pointsRequired <= totalPoints) return 'unlocked'
  if (rewardLevel === nextRewardLevel) return 'current'
  return 'locked'
}

// % progress from tier[i] threshold → tier[i+1] threshold
export function getConnectorFill(
  fromPts: number,
  toPts: number,
  totalPoints: number,
): number {
  const range = toPts - fromPts
  if (range <= 0) return 100
  return Math.min(100, Math.max(0, ((totalPoints - fromPts) / range) * 100))
}

// % progress within the current segment (for the next-reward progress bar)
export function getCurrentSegmentFill(
  totalPoints: number,
  nextRewardLevel: number | null,
): number {
  const levels = AMBASSADOR_REWARD_LEVELS as unknown as Array<{
    reward_level: number
    points_required: number
  }>
  if (!nextRewardLevel) return 100
  const idx = levels.findIndex((l) => l.reward_level === nextRewardLevel)
  if (idx < 0) return 0
  const prevPts = idx === 0 ? 0 : levels[idx - 1].points_required
  const thisPts = levels[idx].points_required
  return getConnectorFill(prevPts, thisPts, totalPoints)
}

export const FALLBACK_TIER_ICON: LucideIcon = Zap
export const FALLBACK_LOCK_ICON: LucideIcon = Lock
