import { Crown, Gift, Medal, Shirt, Star, Ticket } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type {
  AmbassadorPaymentStatus,
  AmbassadorRaceFormat,
  AmbassadorRewardKind,
  AmbassadorRewardStatus,
} from '@/types/Ambassador'

// ─── Reward kinds ──────────────────────────────────────────────────────────────

export const REWARD_KIND_META: Record<AmbassadorRewardKind, { icon: LucideIcon; badgeClass: string }> = {
  recognition: { icon: Medal, badgeClass: 'border-success/40 bg-success/10 text-success' },
  discount: { icon: Gift, badgeClass: 'border-warning/40 bg-warning/10 text-warning' },
  bib: { icon: Ticket, badgeClass: 'border-info/40 bg-info/10 text-info' },
  perk: { icon: Crown, badgeClass: 'border-primary/40 bg-primary/10 text-primary' },
  merch: { icon: Shirt, badgeClass: 'border-warning/40 bg-warning/10 text-warning' },
  refund: { icon: Star, badgeClass: 'border-info/40 bg-info/10 text-info' },
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

export const formatAmbassadorLongDate = (value: string | null | undefined) =>
  value ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeZone: 'Europe/Paris' }).format(new Date(value)) : null

export const formatAmbassadorDate = (value: string | null | undefined) =>
  value ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short' }).format(new Date(value)) : '—'
