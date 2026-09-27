'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  useAdminAmbassadors,
  useAdminAmbassadorDetail,
  useAdminAmbassadorPoints,
  useUpdateAmbassadorReward,
  useTransitionAmbassadorReward,
  useUpdateAmbassadorPoints,
  useAmbassadorCodes,
  useAdminPromoCodes,
  useAssignAmbassadorCode,
  useSetCurrentAmbassadorCode,
  useRemoveAmbassadorCode,
  useAddManualReferralWithPoints,
} from '@/app/api/admin/ambassadors/ambassadorsQueries'
import type { AmbassadorRewardStatus } from '@/types/Ambassador'
import { isAmbassadorRewardExpired } from '@/lib/ambassadors/rewardLifecycle'

const STATUS_LABELS: Record<AmbassadorRewardStatus, string> = {
  earned: 'Débloquée',
  claimed: 'Réclamée',
  fulfilled: 'Envoyée',
  cancelled: 'Annulée',
}

const STATUS_STYLES: Record<AmbassadorRewardStatus, string> = {
  earned: 'border-emerald-500/40 bg-emerald-500/20 text-emerald-600',
  claimed: 'border-amber-500/40 bg-amber-500/20 text-amber-600',
  fulfilled: 'border-sky-500/40 bg-sky-500/20 text-sky-600',
  cancelled: 'border-rose-500/40 bg-rose-500/20 text-rose-600',
}

const formatDateTime = (value: string | null) =>
  value
    ? new Date(value).toLocaleString('fr-FR', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : '-'

export function AmbassadorsSection() {
  const searchParams = useSearchParams()
  const initialSearch = searchParams.get('search')?.trim() ?? ''
  const [search, setSearch] = useState(initialSearch)
  const [statusFilter, setStatusFilter] = useState<AmbassadorRewardStatus | 'all'>('all')
  const [globalYear, setGlobalYear] = useState<string>('current')
  const { data, isLoading, error, refetch, isFetching } = useAdminAmbassadors()
  const updateReward = useUpdateAmbassadorReward()
  const transitionReward = useTransitionAmbassadorReward()
  const { data: pointsData, isLoading: pointsLoading, error: pointsError, refetch: refetchPoints } =
    useAdminAmbassadorPoints(globalYear === 'current' ? null : Number(globalYear))
  const updatePoints = useUpdateAmbassadorPoints()
  const [editingPoints, setEditingPoints] = useState<{
    ambassador_id: string
    ambassador_name: string
    ambassador_code: string | null
    total_points: number
    recruits_open: number
    recruits_ranked: number
    reason: string
  } | null>(null)

  const [managingCodesFor, setManagingCodesFor] = useState<{
    ambassador_id: string
    ambassador_name: string
  } | null>(null)
  const [selectedCodeToAdd, setSelectedCodeToAdd] = useState<string>('')
  const [setAsCurrentOnAdd, setSetAsCurrentOnAdd] = useState(false)

  const { data: ambassadorCodesData, isLoading: codesLoading } = useAmbassadorCodes(
    managingCodesFor?.ambassador_id ?? null,
  )
  const { data: availableCodesData } = useAdminPromoCodes()
  const assignCode = useAssignAmbassadorCode()
  const setCurrentCode = useSetCurrentAmbassadorCode()
  const removeCode = useRemoveAmbassadorCode()
  const addManualReferral = useAddManualReferralWithPoints()
  const [manualReferralDialog, setManualReferralDialog] = useState<{
    ambassador_id: string
    ambassador_name: string
    ambassador_code: string | null
  } | null>(null)
  const [manualReferralEmail, setManualReferralEmail] = useState('')
  const [manualReferralPoints, setManualReferralPoints] = useState(1)
  const [manualReferralFormat, setManualReferralFormat] = useState<'auto' | 'open' | 'ranked'>('auto')
  const [manualReferralMessage, setManualReferralMessage] = useState<string | null>(null)

  const assignedCodeIds = new Set(
    (ambassadorCodesData?.codes ?? []).map((c) => c.promotional_code_id),
  )
  const availableCodesToAdd = (availableCodesData?.codes ?? []).filter(
    (c) => !assignedCodeIds.has(c.id) && !c.assigned_profile_id,
  )

  const rewards = data?.rewards ?? []
  const pointsRows = pointsData?.ambassadors ?? []
  const globalYears = pointsData?.available_program_years ?? []
  const [selectedAmbassadorId, setSelectedAmbassadorId] = useState<string | null>(null)
  const [selectedDetailYear, setSelectedDetailYear] = useState<string>('all')
  const { data: ambassadorDetail, isLoading: detailLoading } = useAdminAmbassadorDetail(selectedAmbassadorId)
  const detailYears = ambassadorDetail?.yearly_points.map((row) => row.program_year) ?? []
  const visibleDetailRewards = (ambassadorDetail?.rewards ?? []).filter(
    (reward) => selectedDetailYear === 'all' || reward.program_year === Number(selectedDetailYear),
  )

  useEffect(() => {
    if (!initialSearch) return
    setSearch((prev) => (prev ? prev : initialSearch))
  }, [initialSearch])

  const filteredRewards = useMemo(() => {
    const term = search.trim().toLowerCase()
    return rewards.filter((reward) => {
      if (statusFilter !== 'all' && reward.status !== statusFilter) return false
      if (!term) return true
      return [reward.ambassador_name, reward.ambassador_code, reward.reward_name]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    })
  }, [rewards, search, statusFilter])

  const groupedRewards = useMemo(() => {
    const groups = new Map<string, typeof filteredRewards>()
    for (const reward of filteredRewards) {
      const key = reward.ambassador_id
      const current = groups.get(key) ?? []
      current.push(reward)
      groups.set(key, current)
    }
    return Array.from(groups.values())
  }, [filteredRewards])

  const handleStatusChange = async (id: string, status: AmbassadorRewardStatus) => {
    await updateReward.mutateAsync({ id, status })
  }

  const handleRewardTransition = async (id: string, action: 'cancelled' | 'reopened') => {
    const reason = window.prompt(action === 'cancelled' ? 'Motif de l’annulation :' : 'Motif de la réouverture :')?.trim()
    if (!reason) return
    await transitionReward.mutateAsync({
      id,
      action,
      reason,
      idempotency_key: crypto.randomUUID(),
    })
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <CardTitle>Fiches ambassadeurs</CardTitle>
          <p className="text-sm text-muted-foreground">
            Ouvrez une fiche pour consulter ses années, récompenses et historique.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            placeholder="Rechercher un ambassadeur..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="sm:w-64"
          />
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
            <SelectTrigger className="sm:w-48">
              <SelectValue placeholder="Filtrer statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="earned">Débloquée</SelectItem>
              <SelectItem value="claimed">Réclamée</SelectItem>
              <SelectItem value="fulfilled">Envoyée</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? 'Actualisation...' : 'Actualiser'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-6 rounded-lg border bg-card">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div>
              <p className="text-sm font-semibold">Ambassadeurs</p>
              <p className="text-xs text-muted-foreground">Année {pointsData?.program_year ?? 'en cours'} · ouvrez une fiche pour gérer les récompenses sans les mélanger.</p>
            </div>
            <div className="flex gap-2">
              <Select value={globalYear} onValueChange={setGlobalYear}>
                <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">Année en cours</SelectItem>
                  {globalYears.map((year) => <SelectItem key={year} value={String(year)}>{year}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => refetchPoints()} disabled={pointsLoading}>
                {pointsLoading ? 'Actualisation...' : 'Actualiser'}
              </Button>
            </div>
          </div>
          {pointsError ? (
            <div className="px-4 py-3 text-sm text-destructive">
              Impossible de charger les points. {pointsError.message}
            </div>
          ) : (
            <>
            <div className="space-y-3 md:hidden">
              {pointsLoading ? <div className="rounded-lg border p-6 text-center text-sm text-muted-foreground">Chargement...</div> : null}
              {!pointsLoading && pointsRows.length === 0 ? <div className="rounded-lg border p-6 text-center text-sm text-muted-foreground">Aucun ambassadeur.</div> : null}
              {!pointsLoading && pointsRows.map((row) => (
                <div key={row.ambassador_id} className="rounded-lg border bg-background p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{row.ambassador_name}</p>
                      <p className="truncate font-mono text-xs text-muted-foreground">{row.ambassador_code ?? 'Aucun code actif'}</p>
                    </div>
                    <span className="shrink-0 text-lg font-bold">{row.total_points} pts</span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <span>Open <strong className="text-foreground">{row.recruits_open}</strong></span>
                    <span>Ranked <strong className="text-foreground">{row.recruits_ranked}</strong></span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <Button size="sm" className="col-span-2" onClick={() => { setSelectedAmbassadorId(row.ambassador_id); setSelectedDetailYear('all') }}>Ouvrir la fiche</Button>
                    <Button size="sm" variant="outline" onClick={() => setManagingCodesFor({ ambassador_id: row.ambassador_id, ambassador_name: row.ambassador_name })}>Codes</Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingPoints({ ambassador_id: row.ambassador_id, ambassador_name: row.ambassador_name, ambassador_code: row.ambassador_code, total_points: row.total_points, recruits_open: row.recruits_open, recruits_ranked: row.recruits_ranked, reason: '' })}>Points</Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="hidden overflow-x-auto md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ambassadeur</TableHead>
                    <TableHead>Code actif</TableHead>
                    <TableHead className="text-right">Points</TableHead>
                    <TableHead className="text-right">Open</TableHead>
                    <TableHead className="text-right">Ranked</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pointsLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        Chargement...
                      </TableCell>
                    </TableRow>
                  ) : pointsRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        Aucun ambassadeur.
                      </TableCell>
                    </TableRow>
                  ) : (
                    pointsRows.map((row) => (
                      <TableRow key={row.ambassador_id}>
                        <TableCell className="font-medium">
                          <Button
                            variant="link"
                            className="h-auto p-0 font-semibold"
                            onClick={() => {
                              setSelectedAmbassadorId(row.ambassador_id)
                              setSelectedDetailYear('all')
                            }}
                          >
                            {row.ambassador_name}
                          </Button>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{row.ambassador_code ?? '-'}</TableCell>
                        <TableCell className="text-right font-semibold">{row.total_points}</TableCell>
                        <TableCell className="text-right">{row.recruits_open}</TableCell>
                        <TableCell className="text-right">{row.recruits_ranked}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedAmbassadorId(row.ambassador_id)
                                setSelectedDetailYear('all')
                              }}
                            >
                              Ouvrir la fiche
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setManagingCodesFor({
                                  ambassador_id: row.ambassador_id,
                                  ambassador_name: row.ambassador_name,
                                })
                              }
                            >
                              Codes
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setEditingPoints({
                                  ambassador_id: row.ambassador_id,
                                  ambassador_name: row.ambassador_name,
                                  ambassador_code: row.ambassador_code,
                                  total_points: row.total_points,
                                  recruits_open: row.recruits_open,
                                  recruits_ranked: row.recruits_ranked,
                                  reason: '',
                                })
                              }
                            >
                              Points
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setManualReferralDialog({
                                  ambassador_id: row.ambassador_id,
                                  ambassador_name: row.ambassador_name,
                                  ambassador_code: row.ambassador_code,
                                })
                                setManualReferralEmail('')
                                setManualReferralPoints(1)
                                setManualReferralFormat('auto')
                                setManualReferralMessage(null)
                              }}
                            >
                              Filleul + point
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            </>
          )}
        </div>

        {error ? (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            Impossible de charger les récompenses. {error.message}
          </div>
        ) : null}

        <div className="space-y-3">
          {isLoading ? (
            <div className="rounded-lg border p-8 text-center text-muted-foreground">Chargement...</div>
          ) : groupedRewards.length === 0 ? (
            <div className="rounded-lg border p-8 text-center text-muted-foreground">Aucun résultat.</div>
          ) : (
            groupedRewards.map((ambassadorRewards) => {
              const ambassador = ambassadorRewards[0]
              const earned = ambassadorRewards.filter((reward) => reward.status === 'earned').length
              const claimed = ambassadorRewards.filter((reward) => reward.status === 'claimed').length
              const fulfilled = ambassadorRewards.filter((reward) => reward.status === 'fulfilled').length
              return (
                <details key={ambassador.ambassador_id} className="group rounded-lg border bg-card" open>
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 [&::-webkit-details-marker]:hidden">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{ambassador.ambassador_name}</p>
                      <p className="font-mono text-xs text-muted-foreground">{ambassador.ambassador_code ?? 'Aucun code actif'}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 text-xs">
                      <Badge variant="outline">{ambassadorRewards.length} rewards</Badge>
                      <Badge className={STATUS_STYLES.earned}>{earned} à traiter</Badge>
                      <Badge className={STATUS_STYLES.claimed}>{claimed} réclamées</Badge>
                      <Badge className={STATUS_STYLES.fulfilled}>{fulfilled} envoyées</Badge>
                    </div>
                  </summary>
                  <div className="border-t md:hidden">
                    <div className="space-y-2 p-3">
                      {ambassadorRewards.map((reward) => {
                        const expired = isAmbassadorRewardExpired(reward.expires_at)
                        return (
                          <div key={reward.id} className="space-y-3 rounded-lg border bg-background p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="font-medium">Palier {reward.reward_level}</p>
                                <p className="truncate text-xs text-muted-foreground">{reward.reward_name}</p>
                              </div>
                              <div className="flex shrink-0 flex-wrap justify-end gap-1">
                                <Badge className={STATUS_STYLES[reward.status]}>{STATUS_LABELS[reward.status]}</Badge>
                                {expired ? <Badge variant="outline">Expirée</Badge> : null}
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                              <span>Année <strong className="text-foreground">{reward.program_year ?? '—'}</strong></span>
                              <span>Expire <strong className="text-foreground">{formatDateTime(reward.expires_at)}</strong></span>
                            </div>
                            <Select
                              value={reward.status}
                              onValueChange={(value) => handleStatusChange(reward.id, value as AmbassadorRewardStatus)}
                              disabled={updateReward.isPending}
                            >
                              <SelectTrigger className="w-full"><SelectValue placeholder="Changer le statut" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="earned">Débloquée</SelectItem>
                                <SelectItem value="claimed">Réclamée</SelectItem>
                                <SelectItem value="fulfilled">Envoyée</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  <div className="hidden overflow-x-auto border-t md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Palier</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead>Débloquée</TableHead>
                          <TableHead>Réclamée</TableHead>
                          <TableHead>Envoyée</TableHead>
                          <TableHead className="w-44">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ambassadorRewards.map((reward) => (
                          <TableRow key={reward.id}>
                            <TableCell className="font-medium">Palier {reward.reward_level} · {reward.reward_name}</TableCell>
                            <TableCell><Badge className={STATUS_STYLES[reward.status]}>{STATUS_LABELS[reward.status]}</Badge></TableCell>
                            <TableCell>{formatDateTime(reward.earned_at)}</TableCell>
                            <TableCell>{formatDateTime(reward.claimed_at)}</TableCell>
                            <TableCell>{formatDateTime(reward.fulfilled_at)}</TableCell>
                            <TableCell>
                              <Select
                                value={reward.status}
                                onValueChange={(value) => handleStatusChange(reward.id, value as AmbassadorRewardStatus)}
                                disabled={updateReward.isPending}
                              >
                                <SelectTrigger><SelectValue placeholder="Changer" /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="earned">Débloquée</SelectItem>
                                  <SelectItem value="claimed">Réclamée</SelectItem>
                                  <SelectItem value="fulfilled">Envoyée</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </details>
              )
            })
          )}
        </div>
      </CardContent>

      <Dialog open={Boolean(selectedAmbassadorId)} onOpenChange={(open) => !open && setSelectedAmbassadorId(null)}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{ambassadorDetail?.ambassador.name ?? 'Fiche ambassadeur'}</DialogTitle>
            <DialogDescription>
              {ambassadorDetail?.ambassador.code ? `Code : ${ambassadorDetail.ambassador.code}` : 'Historique et récompenses'}
            </DialogDescription>
          </DialogHeader>
          {detailLoading ? <p className="text-sm text-muted-foreground">Chargement…</p> : null}
          {ambassadorDetail ? <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {ambassadorDetail.yearly_points.map((year) => (
                <div key={year.program_year} className="rounded-lg border p-3">
                  <p className="font-semibold">{year.program_year}</p>
                  <p className="text-2xl font-bold">{year.total_points} pts</p>
                  <p className="text-xs text-muted-foreground">{year.recruits_open} Open · {year.recruits_ranked} Ranked</p>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-semibold">Récompenses</p>
                <Select value={selectedDetailYear} onValueChange={setSelectedDetailYear}>
                  <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Filtrer par année" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les années</SelectItem>
                    {detailYears.map((year) => <SelectItem key={year} value={String(year)}>{year}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {visibleDetailRewards.length === 0 ? (
                <p className="rounded-lg border p-3 text-sm text-muted-foreground">Aucune récompense pour cette année.</p>
              ) : visibleDetailRewards.map((reward) => (
                <div key={reward.id} className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">{reward.program_year} · Palier {reward.reward_level} — {reward.reward_name}</p>
                    <p className="text-xs text-muted-foreground">
                      Expire le {formatDateTime(reward.expires_at)}
                      {reward.cancellation_reason ? ` · Motif : ${reward.cancellation_reason}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={STATUS_STYLES[reward.status]}>{STATUS_LABELS[reward.status]}</Badge>
                    {reward.is_expired ? <Badge variant="outline">Expirée</Badge> : null}
                    {reward.status !== 'cancelled' ? (
                      <Select
                        value={reward.status}
                        onValueChange={(value) => handleStatusChange(reward.id, value as AmbassadorRewardStatus)}
                        disabled={updateReward.isPending}
                      >
                        <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="earned">Débloquée</SelectItem>
                          <SelectItem value="claimed">Réclamée</SelectItem>
                          <SelectItem value="fulfilled">Envoyée</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : null}
                    {reward.status === 'cancelled' ? (
                      <Button size="sm" variant="outline" disabled={transitionReward.isPending} onClick={() => handleRewardTransition(reward.id, 'reopened')}>
                        Rouvrir
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" disabled={transitionReward.isPending} onClick={() => handleRewardTransition(reward.id, 'cancelled')}>
                        Annuler
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {ambassadorDetail.audit_events.length > 0 ? <div className="space-y-2">
              <p className="text-sm font-semibold">Historique des décisions</p>
              {ambassadorDetail.audit_events.map((event) => (
                <div key={`${event.reward_id}-${event.occurred_at}`} className="rounded-lg border p-3 text-sm">
                  <p className="font-medium">{event.action === 'cancelled' ? 'Récompense annulée' : 'Récompense rouverte'} · {formatDateTime(event.occurred_at)}</p>
                  <p className="text-muted-foreground">{event.reason}</p>
                </div>
              ))}
            </div> : null}
          </div> : null}
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(managingCodesFor)}
        onOpenChange={(open) => {
          if (!open) {
            setManagingCodesFor(null)
            setSelectedCodeToAdd('')
            setSetAsCurrentOnAdd(false)
          }
        }}
      >
        <DialogContent className="sm:max-w-130">
          <DialogHeader>
            <DialogTitle>Codes promo</DialogTitle>
            <DialogDescription>
              {managingCodesFor?.ambassador_name} — codes assignés et historiques
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            {codesLoading ? (
              <p className="text-sm text-muted-foreground">Chargement…</p>
            ) : (ambassadorCodesData?.codes ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun code assigné.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {(ambassadorCodesData?.codes ?? []).map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between rounded-lg border px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-medium">{c.code ?? c.promotional_code_id}</span>
                      {c.name ? (
                        <span className="text-xs text-muted-foreground">{c.name}</span>
                      ) : null}
                      {c.is_current ? (
                        <Badge className="border-emerald-500/40 bg-emerald-500/20 text-emerald-600 text-xs">
                          Actif
                        </Badge>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-1">
                      {!c.is_current ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs"
                          disabled={setCurrentCode.isPending}
                          onClick={async () => {
                            if (!managingCodesFor) return
                            await setCurrentCode.mutateAsync({
                              ambassador_id: managingCodesFor.ambassador_id,
                              junction_id: c.id,
                            })
                          }}
                        >
                          Définir actif
                        </Button>
                      ) : null}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs text-destructive hover:text-destructive"
                        disabled={removeCode.isPending}
                        onClick={async () => {
                          if (!managingCodesFor) return
                          await removeCode.mutateAsync({
                            ambassador_id: managingCodesFor.ambassador_id,
                            junction_id: c.id,
                          })
                        }}
                      >
                        Retirer
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="rounded-lg border px-3 py-3">
              <p className="mb-2 text-xs font-semibold">Ajouter un code</p>
              <div className="flex flex-col gap-2">
                <Select value={selectedCodeToAdd} onValueChange={setSelectedCodeToAdd}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un code promo…" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCodesToAdd.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.code}{c.name ? ` — ${c.name}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={setAsCurrentOnAdd}
                    onChange={(e) => setSetAsCurrentOnAdd(e.target.checked)}
                    className="h-3.5 w-3.5"
                  />
                  Définir comme code actif
                </label>
                <Button
                  size="sm"
                  disabled={!selectedCodeToAdd || assignCode.isPending}
                  onClick={async () => {
                    if (!managingCodesFor || !selectedCodeToAdd) return
                    await assignCode.mutateAsync({
                      ambassador_id: managingCodesFor.ambassador_id,
                      promotional_code_id: selectedCodeToAdd,
                      set_as_current: setAsCurrentOnAdd,
                    })
                    setSelectedCodeToAdd('')
                    setSetAsCurrentOnAdd(false)
                  }}
                >
                  {assignCode.isPending ? 'Assignation…' : 'Ajouter'}
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setManagingCodesFor(null)
                setSelectedCodeToAdd('')
                setSetAsCurrentOnAdd(false)
              }}
            >
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editingPoints)} onOpenChange={(open) => !open && setEditingPoints(null)}>
        <DialogContent className="sm:max-w-130">
          <DialogHeader>
            <DialogTitle>Modifier les points</DialogTitle>
            <DialogDescription>
              Ajuste le total et la répartition Open/Ranked.
            </DialogDescription>
          </DialogHeader>
          {editingPoints ? (
            <div className="grid gap-3">
              <div className="rounded-lg border px-3 py-2 text-sm">
                <div className="font-semibold">{editingPoints.ambassador_name}</div>
                <div className="text-xs text-muted-foreground">{editingPoints.ambassador_code ?? '—'}</div>
              </div>
              <div className="grid gap-2">
                <label className="text-xs font-medium">Total points</label>
                <Input
                  type="number"
                  min={0}
                  value={editingPoints.total_points}
                  onChange={(event) =>
                    setEditingPoints((prev) => (prev ? { ...prev, total_points: Number(event.target.value) } : prev))
                  }
                />
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="grid gap-2">
                  <label className="text-xs font-medium">Open</label>
                  <Input
                    type="number"
                    min={0}
                    value={editingPoints.recruits_open}
                    onChange={(event) =>
                      setEditingPoints((prev) => (prev ? { ...prev, recruits_open: Number(event.target.value) } : prev))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-xs font-medium">Ranked</label>
                  <Input
                    type="number"
                    min={0}
                    value={editingPoints.recruits_ranked}
                    onChange={(event) =>
                      setEditingPoints((prev) => (prev ? { ...prev, recruits_ranked: Number(event.target.value) } : prev))
                    }
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <label className="text-xs font-medium">Motif obligatoire</label>
                <Input
                  value={editingPoints.reason}
                  onChange={(event) => setEditingPoints((prev) => (prev ? { ...prev, reason: event.target.value } : prev))}
                  placeholder="Ex. correction après vérification d’une inscription"
                />
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPoints(null)}>
              Annuler
            </Button>
            <Button
              onClick={async () => {
                if (!editingPoints) return
                await updatePoints.mutateAsync({
                  ambassador_id: editingPoints.ambassador_id,
                  total_points: editingPoints.total_points,
                  recruits_open: editingPoints.recruits_open,
                  recruits_ranked: editingPoints.recruits_ranked,
                  reason: editingPoints.reason,
                  idempotency_key: crypto.randomUUID(),
                })
                setEditingPoints(null)
              }}
              disabled={updatePoints.isPending || editingPoints !== null && editingPoints.reason.trim().length < 3}
            >
              {updatePoints.isPending ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(manualReferralDialog)}
        onOpenChange={(open) => {
          if (!open) {
            setManualReferralDialog(null)
            setManualReferralMessage(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-130">
          <DialogHeader>
            <DialogTitle>Ajouter un filleul manuel + crédit de points</DialogTitle>
            <DialogDescription>
              Ajoute un inscrit dans les filleuls et crédite des points sans doublon.
            </DialogDescription>
          </DialogHeader>
          {manualReferralDialog ? (
            <div className="grid gap-3">
              <div className="rounded-lg border px-3 py-2 text-sm">
                <div className="font-semibold">{manualReferralDialog.ambassador_name}</div>
                <div className="text-xs text-muted-foreground">{manualReferralDialog.ambassador_code ?? '—'}</div>
              </div>
              <div className="grid gap-2">
                <label className="text-xs font-medium">Email du filleul</label>
                <Input
                  type="email"
                  placeholder="exemple@mail.com"
                  value={manualReferralEmail}
                  onChange={(event) => setManualReferralEmail(event.target.value)}
                />
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="grid gap-2">
                  <label className="text-xs font-medium">Points à créditer</label>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={manualReferralPoints}
                    onChange={(event) => setManualReferralPoints(Number(event.target.value || 1))}
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-xs font-medium">Format</label>
                  <Select
                    value={manualReferralFormat}
                    onValueChange={(value) => setManualReferralFormat(value as 'auto' | 'open' | 'ranked')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto (détection ticket)</SelectItem>
                      <SelectItem value="open">OPEN</SelectItem>
                      <SelectItem value="ranked">RANKED</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {manualReferralMessage ? (
                <div className="rounded-md border border-primary/25 bg-primary/5 px-3 py-2 text-xs text-foreground">
                  {manualReferralMessage}
                </div>
              ) : null}
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setManualReferralDialog(null)}>
              Annuler
            </Button>
            <Button
              disabled={
                !manualReferralDialog ||
                !manualReferralEmail.trim() ||
                manualReferralPoints < 1 ||
                addManualReferral.isPending
              }
              onClick={async () => {
                if (!manualReferralDialog) return
                setManualReferralMessage(null)
                const result = await addManualReferral.mutateAsync({
                  ambassador_id: manualReferralDialog.ambassador_id,
                  referral_email: manualReferralEmail.trim(),
                  points: manualReferralPoints,
                  race_format: manualReferralFormat,
                })
                if (result.already_credited) {
                  setManualReferralMessage(
                    'Filleul ajouté (ou déjà présent). Aucun point ajouté car cette inscription était déjà créditée.',
                  )
                } else {
                  setManualReferralMessage(
                    `Filleul ajouté et ${result.points_credited} point(s) crédité(s).`,
                  )
                }
              }}
            >
              {addManualReferral.isPending ? 'Traitement…' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
