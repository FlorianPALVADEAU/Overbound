'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import {
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Crown,
  Gift,
  Lock,
  Medal,
  Shield,
  Share2,
  Shirt,
  Star,
  Ticket,
  Trophy,
  Users,
  Zap,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type {
  AmbassadorDashboardData,
  AmbassadorPaymentStatus,
  AmbassadorRaceFormat,
  AmbassadorRewardStatus,
} from '@/types/Ambassador'
import { claimAmbassadorReward } from '@/app/api/ambassadors/rewards/rewardQueries'
import { AMBASSADOR_REWARD_LEVELS } from '@/lib/ambassadors/program'

// ─── Tier metadata ─────────────────────────────────────────────────────────────

const TIER_META: Record<number, { icon: LucideIcon; description: string }> = {
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

const BADGE_META: Record<number, { label: string; colorClass: string }> = {
  1: { label: 'Badge Starter', colorClass: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600' },
  2: { label: 'Badge Relayeur', colorClass: 'border-sky-500/40 bg-sky-500/10 text-sky-600' },
  3: { label: 'Badge Booster', colorClass: 'border-amber-500/40 bg-amber-500/10 text-amber-600' },
  4: { label: 'Badge Open Hero', colorClass: 'border-indigo-500/40 bg-indigo-500/10 text-indigo-600' },
  5: { label: 'Badge VIP', colorClass: 'border-fuchsia-500/40 bg-fuchsia-500/10 text-fuchsia-600' },
  6: { label: 'Badge Communauté', colorClass: 'border-orange-500/40 bg-orange-500/10 text-orange-600' },
  7: { label: 'Badge Confirmé', colorClass: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-600' },
  8: { label: 'Badge Elite', colorClass: 'border-rose-500/40 bg-rose-500/10 text-rose-600' },
  9: { label: 'Badge Légende', colorClass: 'border-violet-500/40 bg-violet-500/10 text-violet-600' },
  10: { label: 'Badge Officiel', colorClass: 'border-primary/50 bg-primary/10 text-primary' },
}

// ─── Label maps ────────────────────────────────────────────────────────────────

const PAYMENT_STATUS_LABELS: Record<AmbassadorPaymentStatus, string> = {
  paid: 'Payé',
  pending: 'En attente',
  refunded: 'Remboursé',
  cancelled: 'Annulé',
}

const PAYMENT_STATUS_STYLES: Record<AmbassadorPaymentStatus, string> = {
  paid: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600',
  pending: 'border-amber-500/40 bg-amber-500/10 text-amber-600',
  refunded: 'border-sky-500/40 bg-sky-500/10 text-sky-600',
  cancelled: 'border-rose-500/40 bg-rose-500/10 text-rose-600',
}

const REWARD_STATUS_LABELS: Record<AmbassadorRewardStatus, string> = {
  earned: 'Débloquée',
  claimed: 'Réclamée',
  fulfilled: 'Remise',
}

const REWARD_STATUS_STYLES: Record<AmbassadorRewardStatus, string> = {
  earned: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600',
  claimed: 'border-amber-500/40 bg-amber-500/10 text-amber-600',
  fulfilled: 'border-sky-500/40 bg-sky-500/10 text-sky-600',
}

const FORMAT_LABELS: Record<AmbassadorRaceFormat, string> = { open: 'Open', ranked: 'Ranked' }

const formatDate = (value: string | null | undefined) =>
  value ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short' }).format(new Date(value)) : '—'

// ─── Timeline helpers ──────────────────────────────────────────────────────────

type TierState = 'unlocked' | 'current' | 'locked'

function getTierState(
  pointsRequired: number,
  totalPoints: number,
  nextRewardLevel: number | null,
  rewardLevel: number,
): TierState {
  if (pointsRequired <= totalPoints) return 'unlocked'
  if (rewardLevel === nextRewardLevel) return 'current'
  return 'locked'
}

// % progress from tier[i] threshold → tier[i+1] threshold
function getConnectorFill(
  fromPts: number,
  toPts: number,
  totalPoints: number,
): number {
  const range = toPts - fromPts
  if (range <= 0) return 100
  return Math.min(100, Math.max(0, ((totalPoints - fromPts) / range) * 100))
}

// % progress within the current segment (for the next-reward progress bar)
function getCurrentSegmentFill(
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

// ─── Component ─────────────────────────────────────────────────────────────────

interface AmbassadorDashboardProps {
  fullName?: string | null
  email?: string | null
  data: AmbassadorDashboardData
  onRewardClaimed?: () => void | Promise<void>
}

export function AmbassadorDashboard({
  fullName,
  email,
  data,
  onRewardClaimed,
}: AmbassadorDashboardProps) {
  const [copyFeedback, setCopyFeedback] = useState<'idle' | 'copied'>('idle')
  const [claimingLevel, setClaimingLevel] = useState<number | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)
  const [recruitsOpen, setRecruitsOpen] = useState(false)

  const totalPoints = data.total_points
  const nextRewardLevel = data.next_reward?.reward_level ?? null
  const segmentFill = getCurrentSegmentFill(totalPoints, nextRewardLevel)
  const latestPointsEvent = data.recruits_table.find((row) => row.points > 0 && row.payment_status === 'paid') ?? null

  const levels = AMBASSADOR_REWARD_LEVELS as unknown as Array<{
    reward_level: number
    reward_name: string
    points_required: number
  }>
  const unlockedLevels = levels.filter((level) => level.points_required <= totalPoints)
  const currentBadgeLevel = unlockedLevels.length > 0 ? unlockedLevels[unlockedLevels.length - 1].reward_level : null
  const nextBadgeLevels = levels.filter((level) => level.points_required > totalPoints).slice(0, 3)

  const handleCopy = async () => {
    if (!data.code) return
    try {
      await navigator.clipboard.writeText(data.code)
      setCopyFeedback('copied')
      window.setTimeout(() => setCopyFeedback('idle'), 2000)
    } catch {}
  }

  const handleShare = async () => {
    const text = `Rejoins la prochaine course Overbound avec mon code ambassadeur "${data.code}" pour bénéficier d'une réduction ! 🏅`
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ text })
        return
      } catch {}
    }
    await handleCopy()
  }

  const handleClaimReward = async (rewardLevel: number) => {
    setClaimingLevel(rewardLevel)
    setActionError(null)
    setActionSuccess(null)
    try {
      await claimAmbassadorReward(rewardLevel)
      setActionSuccess('Récompense réclamée ! L\u2019équipe Overbound va te contacter.')
      await onRewardClaimed?.()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Impossible de réclamer.')
    } finally {
      setClaimingLevel(null)
    }
  }

  // Levels locked beyond the next one (for the FOMO teaser)
  const fomoLevels = levels.filter(
    (l) => l.points_required > (data.next_reward?.points_required ?? totalPoints),
  )

  return (
    <main className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-5xl space-y-6 p-4 pb-16 md:p-6">

        {/* ── Header ── */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Espace Ambassadeur
            </p>
            <h1 className="text-2xl font-bold sm:text-3xl">{fullName || email || 'Ambassadeur'}</h1>
            <p className="text-sm text-muted-foreground">Programme de parrainage Overbound</p>
            <p className="text-sm text-muted-foreground">
              <a href="#conditions" className="underline">Voir les conditions du programme</a>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">Ambassadeur</Badge>
            <Link href="/account">
              <Button variant="outline" size="sm">Mon compte</Button>
            </Link>
          </div>
        </header>

        {/* ── Hero ── */}
        <div className="relative overflow-hidden rounded-2xl border border-border/60">
          <img
            src="/images/images/overbound-headband-on-chains-with-grass-in-background.avif"
            alt="Ambassadeur Overbound"
            className="h-[200px] w-full object-cover sm:h-[300px]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/70 via-background/30 to-transparent" />
          <div className="absolute left-5 top-5 max-w-xs">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Ambassadeur</p>
            <p className="mt-1 text-lg font-bold text-foreground">Fais grandir la communauté</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Partage ton code et débloque les paliers.
            </p>
          </div>
        </div>


        {/* ── Code card ── */}
        <Card className="border-border/60">
          <CardContent className="p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Ton code ambassadeur
                </p>
                {data.code ? (
                  <>
                    <p className="break-all text-2xl font-black tracking-[0.2em] text-primary sm:text-4xl sm:tracking-[0.3em]">
                      {data.code}
                    </p>
                    <p className="mt-2 max-w-sm text-xs text-muted-foreground">
                      Partage ce code : tes filleuls obtiennent une réduction, toi tu gagnes des points.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-xl font-semibold text-muted-foreground">Non configuré</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Contacte l&apos;équipe Overbound pour associer ton code.
                    </p>
                  </>
                )}
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={handleCopy} disabled={!data.code} className="gap-2">
                  <Copy className="h-4 w-4" />
                  {copyFeedback === 'copied' ? 'Copié !' : 'Copier'}
                </Button>
                <Button size="sm" onClick={handleShare} disabled={!data.code} className="gap-2">
                  <Share2 className="h-4 w-4" />
                  Partager
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>


        {/* ── Conditions notice ── */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground">
          Les conditions du programme ambassadeur sont disponibles plus bas sur la page.
          <a href="#conditions" className="ml-1 underline">Lire les conditions</a>
        </div>

        {/* ── KPI strip ── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card className="border-primary/20 bg-gradient-to-br from-primary/8 to-transparent">
            <CardContent className="p-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary/60">
                Tes points
              </p>
              <div className="flex items-end gap-2">
                <span className="text-5xl font-black tabular-nums leading-none sm:text-6xl">{totalPoints}</span>
                <span className="mb-1 text-lg font-bold text-muted-foreground sm:text-xl">pts</span>
              </div>
              <div className="mt-3 flex items-center gap-5 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-primary/40" />
                  {data.points_breakdown.open_count} Open
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  {data.points_breakdown.ranked_count} Ranked
                  <span className="text-[10px] font-bold text-primary">×2</span>
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className={cn('border-border/60', data.next_reward && 'border-primary/25')}>
            <CardContent className="p-5">
              {data.next_reward ? (
                <>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Prochain palier
                  </p>
                  <p className="text-lg font-bold leading-snug">{data.next_reward.reward_name}</p>
                  <div className="mt-3 space-y-1.5">
                    <div className="flex justify-between text-[11px] text-muted-foreground">
                      <span className="font-medium">{totalPoints} pts</span>
                      <span className="font-bold text-primary">
                        encore {data.next_reward.points_remaining} pt
                        {data.next_reward.points_remaining > 1 ? 's' : ''}
                      </span>
                      <span>{data.next_reward.points_required} pts</span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-700"
                        style={{ width: `${segmentFill}%` }}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex h-full flex-col justify-center py-2">
                  <p className="text-base font-bold text-primary">
                    Tous les paliers débloqués 🏆
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Tu as atteint le statut maximum.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Ambassador badges ── */}
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

        {/* ── Timeline ── */}
        <Card className="overflow-visible">
          <CardHeader className="pb-0 pt-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Parcours des récompenses
            </p>
          </CardHeader>
          <CardContent className="pt-8 pb-7">
            <div className="overflow-x-auto pb-2">
              <div className="flex min-w-[1200px] items-start gap-2 px-2 sm:gap-3">
                {levels.map((tier, i) => {
                  const state = getTierState(tier.points_required, totalPoints, nextRewardLevel, tier.reward_level)
                  const meta = TIER_META[tier.reward_level]
                  const Icon = meta?.icon ?? Zap
                  const isLast = i === levels.length - 1
                  const connFill = !isLast
                    ? getConnectorFill(tier.points_required, levels[i + 1].points_required, totalPoints)
                    : 0

                  return (
                    <div key={tier.reward_level} className="flex flex-1 items-start">
                      <div className="flex min-w-[120px] flex-1 flex-col items-center gap-1.5 sm:min-w-[130px]">
                        {/* Node circle */}
                        <div className="relative flex h-16 w-16 items-center justify-center">
                          {state === 'current' && (
                            <span className="absolute inset-0 rounded-full border border-primary/30 bg-primary/10 animate-pulse" />
                          )}
                          <div
                            className={cn(
                              'relative z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all duration-300',
                              state === 'unlocked' &&
                                'border-primary bg-primary text-white shadow-lg shadow-primary/25',
                              state === 'current' &&
                                'border-primary bg-background text-primary ring-4 ring-primary/10',
                              state === 'locked' &&
                                'border-border/40 bg-muted/30 text-muted-foreground/35',
                            )}
                          >
                            {state === 'unlocked' ? (
                              <Check className="h-5 w-5" />
                            ) : state === 'locked' ? (
                              <Lock className="h-4 w-4" />
                            ) : (
                              <Icon className="h-5 w-5" />
                            )}
                          </div>
                        </div>

                        <span
                          className={cn(
                            'text-[10px] font-bold tabular-nums',
                            state === 'unlocked' && 'text-primary',
                            state === 'current' && 'text-primary',
                            state === 'locked' && 'text-muted-foreground/40',
                          )}
                        >
                          {tier.points_required} pts
                        </span>

                        <p
                          className={cn(
                            'text-center text-[10px] leading-snug break-words',
                            state === 'unlocked' && 'font-semibold text-foreground',
                            state === 'current' && 'font-bold text-primary',
                            state === 'locked' && 'text-muted-foreground/45',
                          )}
                        >
                          {tier.reward_name}
                        </p>

                        {state === 'unlocked' && (
                          <span className="text-[9px] font-semibold uppercase tracking-wide text-emerald-600">
                            ✓ Débloqué
                          </span>
                        )}
                        {state === 'current' && (
                          <span className="animate-pulse text-[9px] font-semibold uppercase tracking-wide text-primary">
                            En cours…
                          </span>
                        )}
                        {state === 'locked' && (
                          <span className="text-[9px] uppercase tracking-wide text-muted-foreground/35">
                            −{tier.points_required - totalPoints} pts
                          </span>
                        )}
                      </div>

                      {/* Connector */}
                      {!isLast && (
                      <div className="relative mt-8 mx-1 h-1 flex-1 overflow-hidden rounded-full bg-border/30">
                          <div
                            className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all duration-700"
                            style={{ width: `${connFill}%` }}
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Motivational / FOMO banner ── */}
        {data.next_reward ? (
          <div className="overflow-hidden rounded-xl border border-primary/25 bg-gradient-to-r from-primary/8 via-primary/4 to-transparent p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <Zap className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="font-bold">Plus que {data.next_reward.points_remaining} point{data.next_reward.points_remaining > 1 ? 's' : ''} pour débloquer :</p>
                  <p className="mt-0.5 text-sm font-semibold text-primary">
                    {data.next_reward.reward_name}
                  </p>
                  {TIER_META[data.next_reward.reward_level] && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {TIER_META[data.next_reward.reward_level].description}
                    </p>
                  )}
                  <p className="mt-1.5 text-[11px] text-muted-foreground/70">
                    Open = 1 pt · Ranked = 2 pts
                  </p>
                  {latestPointsEvent && (
                    <p className="mt-1.5 text-[11px] font-semibold text-emerald-600">
                      Dernier gain: +{latestPointsEvent.points} point{latestPointsEvent.points > 1 ? 's' : ''}
                      {latestPointsEvent.race_format === 'ranked' ? ' (bonus Ranked)' : ''}
                    </p>
                  )}
                </div>
              </div>
              {data.code && (
                <Button size="sm" onClick={handleShare} className="shrink-0 gap-2 sm:self-start">
                  <Share2 className="h-3.5 w-3.5" />
                  Partager maintenant
                </Button>
              )}
            </div>

            {/* Locked levels teaser */}
            {fomoLevels.length > 0 && (
              <div className="mt-4 border-t border-primary/10 pt-4">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Et ensuite…
                </p>
                <div className="flex flex-wrap gap-2">
                  {fomoLevels.map((l) => {
                    const FomoIcon = TIER_META[l.reward_level]?.icon ?? Lock
                    return (
                      <div
                        key={l.reward_level}
                        className="flex items-center gap-1.5 rounded-full border border-border/40 bg-background/50 px-3 py-1 text-[11px] text-muted-foreground/55 backdrop-blur-sm"
                      >
                        <Lock className="h-3 w-3" />
                        <FomoIcon className="h-3 w-3" />
                        <span>{l.reward_name}</span>
                        <span className="font-bold">({l.points_required} pts)</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-5">
            <div className="flex items-start gap-3">
              <Star className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
              <div>
                <p className="font-bold">
                  Tous les paliers débloqués ! Tu es une légende Overbound 🏆
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Tu as atteint le statut maximum. Merci pour ton engagement.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Leaderboard ── */}
        <Card>
          <CardHeader className="pb-3 pt-5">
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="h-4 w-4" />
              Classement ambassadeurs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm">
              {data.leaderboard.current_user_rank ? (
                <p>
                  Tu es actuellement <span className="font-bold text-primary">#{data.leaderboard.current_user_rank}</span> sur {data.leaderboard.total_ambassadors} ambassadeurs actifs.
                </p>
              ) : (
                <p>Tu apparaitras dans le classement dès que ton profil ambassadeur sera actif.</p>
              )}
            </div>
            {data.leaderboard.top.length === 0 ? (
              <p className="text-sm text-muted-foreground">Classement indisponible pour le moment.</p>
            ) : (
              <div className="space-y-2">
                {data.leaderboard.top.map((entry) => (
                  <div
                    key={`${entry.rank}-${entry.name}`}
                    className={cn(
                      'flex items-center justify-between rounded-lg border px-3 py-2 text-sm',
                      entry.is_current_user && 'border-primary/40 bg-primary/10',
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className={cn('w-7 text-center font-semibold', entry.rank <= 3 && 'text-primary')}>
                        #{entry.rank}
                      </span>
                      <span className={cn(entry.is_current_user && 'font-semibold text-primary')}>
                        {entry.name}
                      </span>
                    </div>
                    <span className="font-semibold tabular-nums">{entry.points} pts</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Earned rewards ── */}
        {data.rewards.length > 0 && (
          <Card>
            <CardHeader className="pb-3 pt-5">
              <CardTitle className="flex items-center gap-2 text-base">
                Tes récompenses débloquées
                <Badge variant="secondary">{data.rewards.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {actionError && (
                <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {actionError}
                </p>
              )}
              {actionSuccess && (
                <p className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-600">
                  {actionSuccess}
                </p>
              )}
              {data.rewards.map((reward) => {
                const meta = TIER_META[reward.reward_level]
                const Icon = meta?.icon ?? Zap
                return (
                  <div
                    key={reward.id}
                    className="flex flex-col gap-3 rounded-xl border border-border/60 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">
                          Palier {reward.reward_level} — {reward.reward_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Débloquée le {formatDate(reward.earned_at)}
                          {reward.claimed_at
                            ? ` · Réclamée le ${formatDate(reward.claimed_at)}`
                            : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={REWARD_STATUS_STYLES[reward.status]}>
                        {REWARD_STATUS_LABELS[reward.status]}
                      </Badge>
                      {reward.status === 'earned' && (
                        <Button
                          size="sm"
                          onClick={() => handleClaimReward(reward.reward_level)}
                          disabled={claimingLevel === reward.reward_level}
                        >
                          {claimingLevel === reward.reward_level ? 'Envoi…' : 'Réclamer'}
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        )}

        {/* ── Recruits table (collapsible) ── */}
        <Card>
          <CardHeader className="pb-0 pt-5">
            <button
              type="button"
              onClick={() => setRecruitsOpen((prev) => !prev)}
              className="flex w-full items-center justify-between"
            >
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4" />
                Mes filleuls
                {data.recruits_table.length > 0 && (
                  <Badge variant="secondary">{data.recruits_table.length}</Badge>
                )}
              </CardTitle>
              {recruitsOpen ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          </CardHeader>

          <div
            className={cn(
              'overflow-hidden transition-all duration-200 ease-in-out',
              recruitsOpen ? 'max-h-[700px]' : 'max-h-0',
            )}
          >
            <CardContent className="pt-4">
              {data.recruits_table.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <Users className="h-10 w-10 text-muted-foreground/25" />
                  <div>
                    <p className="font-medium text-muted-foreground">
                      Personne n&apos;a encore utilisé ton code.
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground/60">
                      Commence à partager pour voir tes filleuls apparaître ici !
                    </p>
                  </div>
                  {data.code && (
                    <Button size="sm" variant="outline" onClick={handleShare} className="gap-2">
                      <Share2 className="h-3.5 w-3.5" />
                      Partager mon code
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Filleul</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Format</TableHead>
                        <TableHead>Paiement</TableHead>
                        <TableHead className="text-right">Points</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.recruits_table.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell className="text-sm font-medium">
                            {row.name ?? 'Utilisateur'}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(row.signup_date)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {FORMAT_LABELS[row.race_format]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={cn('text-xs', PAYMENT_STATUS_STYLES[row.payment_status])}
                            >
                              {PAYMENT_STATUS_LABELS[row.payment_status]}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right tabular-nums font-semibold">
                            {row.points > 0 ? (
                              <span className="text-primary">+{row.points}</span>
                            ) : (
                              <span className="text-muted-foreground/40">0</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </div>
        </Card>

        {/* ── Conditions ── */}
        <Card id="conditions" className="border-border/60">
          <CardHeader className="pb-2 pt-5">
            <CardTitle className="text-base">Conditions du programme ambassadeur</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Les récompenses sont personnelles, non revendables et non convertibles en cash.</p>
            <p>Les points sont attribués uniquement pour des commandes payées.</p>
            <p>Deux codes promo maximum par commande (1 standard + 1 ambassadeur).</p>
            <p>En cas de conflit de codes, la meilleure réduction est conservée et l’utilisateur est informé.</p>
            <p>Tu peux suivre tes points, tes paliers et tes récompenses dans cet espace.</p>
          </CardContent>
        </Card>

      </div>
    </main>
  )
}
