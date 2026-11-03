'use client'

import { useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { RefreshCw } from 'lucide-react'
import {
  useAdminAmbassadorPoints,
  useAdminAmbassadors,
  type AdminAmbassadorPointsRow,
  type AdminAmbassadorReward,
} from '@/app/api/admin/ambassadors/ambassadorsQueries'
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader'
import {
  OperationsList,
  type OperationsListAction,
  type OperationsListColumn,
  type OperationsListFilter,
} from '@/components/admin/operations'
import { useClientPagination } from '@/components/admin/operations/clientPagination'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { AmbassadorRewardStatus } from '@/types/Ambassador'
import { AmbassadorCodesDialog } from './AmbassadorCodesDialog'
import { AmbassadorDetailDialog } from './AmbassadorDetailDialog'
import { AmbassadorPointsDialog } from './AmbassadorPointsDialog'
import { ManualReferralDialog } from './ManualReferralDialog'
import { filterAmbassadorRows, filterRewards } from './ambassadorFilters'
import { formatDateTime, REWARD_STATUS_LABELS, REWARD_STATUS_STYLES, SETTABLE_REWARD_STATUSES } from './rewardStatus'
import { useRewardActions } from './useRewardActions'

const REWARD_STATUSES = ['earned', 'claimed', 'fulfilled', 'cancelled'] as const satisfies readonly AmbassadorRewardStatus[]
const isRewardStatus = (value: string): value is AmbassadorRewardStatus => REWARD_STATUSES.some((status) => status === value)

type RowDialog = { kind: 'detail' | 'codes' | 'points' | 'referral'; row: AdminAmbassadorPointsRow }

const rankingColumns: OperationsListColumn<AdminAmbassadorPointsRow>[] = [
  {
    id: 'ambassador',
    header: 'Ambassadeur',
    cell: (row) => (
      <>
        <p className="font-semibold">{row.ambassador_name}</p>
        {!row.is_active ? <p className="text-xs text-muted-foreground">Inactif</p> : null}
      </>
    ),
  },
  { id: 'code', mobile: 'summary', header: 'Code actif', cell: (row) => <span className="break-all font-mono text-xs">{row.ambassador_code ?? 'Aucun code actif'}</span> },
  { id: 'points', mobile: 'summary', header: 'Points', cell: (row) => <span className="font-semibold tabular-nums">{row.total_points} pts</span>, className: 'text-right', headerClassName: 'text-right' },
  { id: 'open', mobile: 'detail', header: 'Open', cell: (row) => <span className="tabular-nums">{row.recruits_open}</span>, className: 'text-right', headerClassName: 'text-right' },
  { id: 'ranked', mobile: 'detail', header: 'Ranked', cell: (row) => <span className="tabular-nums">{row.recruits_ranked}</span>, className: 'text-right', headerClassName: 'text-right' },
]

/** Ambassador ranking for the season and the rewards they earned, with every manual correction in one place. */
export function AmbassadorsSection() {
  const searchParams = useSearchParams()
  const [rankingSearch, setRankingSearch] = useState(searchParams.get('search')?.trim() ?? '')
  const [season, setSeason] = useState('current')
  const [rewardSearch, setRewardSearch] = useState('')
  const [rewardStatus, setRewardStatus] = useState<AmbassadorRewardStatus | null>(null)
  const [dialog, setDialog] = useState<RowDialog | null>(null)

  const ranking = useAdminAmbassadorPoints(season === 'current' ? null : Number(season))
  const rewardsQuery = useAdminAmbassadors()
  const actions = useRewardActions()

  const rankingRows = useMemo(() => filterAmbassadorRows(ranking.data?.ambassadors ?? [], rankingSearch), [ranking.data, rankingSearch])
  const rewards = useMemo(() => filterRewards(rewardsQuery.data?.rewards ?? [], rewardSearch, rewardStatus), [rewardsQuery.data, rewardSearch, rewardStatus])
  const rankingPage = useClientPagination(rankingRows, `${rankingSearch}|${season}`)
  const rewardsPage = useClientPagination(rewards, `${rewardSearch}|${rewardStatus ?? ''}`)

  const openDialog = (kind: RowDialog['kind']) => (row: AdminAmbassadorPointsRow) => setDialog({ kind, row })
  const rankingActions: OperationsListAction<AdminAmbassadorPointsRow>[] = [
    { id: 'detail', label: 'Ouvrir la fiche', onSelect: openDialog('detail') },
    { id: 'codes', label: 'Codes promo', onSelect: openDialog('codes') },
    { id: 'points', label: 'Modifier les points', onSelect: openDialog('points') },
    { id: 'referral', label: 'Ajouter un filleul et des points', onSelect: openDialog('referral') },
  ]

  const rewardColumns: OperationsListColumn<AdminAmbassadorReward>[] = [
    {
      id: 'ambassador',
      header: 'Ambassadeur',
      cell: (reward) => (
        <>
          <p className="font-semibold">{reward.ambassador_name}</p>
          <p className="break-all font-mono text-xs text-muted-foreground">{reward.ambassador_code ?? 'Aucun code actif'}</p>
        </>
      ),
    },
    {
      id: 'reward',
      mobile: 'summary',
      header: 'Palier',
      cell: (reward) => (
        <>
          <p>Palier {reward.reward_level}</p>
          <p className="text-xs text-muted-foreground">{reward.reward_name}</p>
        </>
      ),
      mobileCell: (reward) => `Palier ${reward.reward_level} · ${reward.reward_name}`,
    },
    {
      id: 'status',
      mobile: 'summary',
      header: 'Statut',
      cell: (reward) => <Badge className={REWARD_STATUS_STYLES[reward.status]}>{REWARD_STATUS_LABELS[reward.status]}</Badge>,
    },
    { id: 'earned', mobile: 'detail', header: 'Débloquée', cell: (reward) => formatDateTime(reward.earned_at) },
    { id: 'claimed', mobile: 'detail', header: 'Réclamée', cell: (reward) => formatDateTime(reward.claimed_at) },
    { id: 'fulfilled', mobile: 'detail', header: 'Envoyée', cell: (reward) => formatDateTime(reward.fulfilled_at) },
    { id: 'expires', mobile: 'detail', header: 'Expire', cell: (reward) => (reward.expires_at ? formatDateTime(reward.expires_at) : 'Jamais'), hiddenByDefault: true },
    { id: 'season', mobile: 'detail', header: 'Saison', cell: (reward) => reward.program_year ?? '—', hiddenByDefault: true },
    { id: 'cancellation', mobile: 'detail', header: 'Motif d’annulation', cell: (reward) => reward.cancellation_reason ?? '—', hiddenByDefault: true },
  ]

  const rewardActions: OperationsListAction<AdminAmbassadorReward>[] = [
    ...SETTABLE_REWARD_STATUSES.map((status) => ({
      id: `status-${status}`,
      label: `Marquer « ${REWARD_STATUS_LABELS[status].toLowerCase()} »`,
      onSelect: (reward: AdminAmbassadorReward) => void actions.setStatus(reward.id, status),
      disabled: (reward: AdminAmbassadorReward) => reward.status === status || reward.status === 'cancelled' || actions.pending,
    })),
    { id: 'reopen', label: 'Rouvrir', onSelect: (reward) => actions.askTransition(reward.id, 'reopened'), disabled: (reward) => reward.status !== 'cancelled' || actions.pending },
    { id: 'cancel', label: 'Annuler la récompense', destructive: true, onSelect: (reward) => actions.askTransition(reward.id, 'cancelled'), disabled: (reward) => reward.status === 'cancelled' || actions.pending },
  ]

  const rewardFilters: OperationsListFilter[] = [
    {
      id: 'status',
      label: 'Statut',
      value: rewardStatus ?? '',
      allLabel: 'Tous les statuts',
      options: REWARD_STATUSES.map((value) => ({ value, label: REWARD_STATUS_LABELS[value] })),
    },
  ]

  const programYear = ranking.data?.program_year
  const seasons = ranking.data?.available_program_years ?? []

  return (
    <div className="space-y-8">
      <AdminPageHeader eyebrow="Communauté" title="Ambassadeurs" description="Classement de la saison, récompenses à remettre, codes promo et corrections de points." />

      {actions.notice ? (
        <Alert variant={actions.notice.tone === 'error' ? 'destructive' : 'default'} role="status">
          <AlertDescription className="flex items-center justify-between gap-3">
            <span>{actions.notice.text}</span>
            <Button type="button" variant="ghost" size="sm" onClick={actions.clearNotice}>Fermer</Button>
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-3">
        <h2 className="text-title font-display font-bold uppercase">Classement</h2>
        <OperationsList
          storageKey="ambassadors-ranking"
          data={rankingPage.data}
          status={ranking.error ? 'error' : ranking.isLoading ? 'loading' : ranking.isFetching ? 'stale' : 'idle'}
          errorMessage={ranking.error?.message}
          onRetry={() => void ranking.refetch()}
          getItemId={(row) => row.ambassador_id}
          columns={rankingColumns}
          rowActions={rankingActions}
          search={rankingSearch}
          searchPlaceholder="Nom ou code promo"
          onSearchChange={setRankingSearch}
          toolbarActions={
            <>
              <Select value={season} onValueChange={setSeason}>
                <SelectTrigger className="w-44" aria-label="Saison"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">Saison en cours</SelectItem>
                  {seasons.map((value) => <SelectItem key={value} value={String(value)}>{value}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button type="button" variant="outline" size="sm" onClick={() => void ranking.refetch()} disabled={ranking.isFetching}>
                <RefreshCw className={ranking.isFetching ? 'animate-spin' : undefined} />
                Actualiser
              </Button>
            </>
          }
          pagination={rankingPage.pagination}
          onPaginationChange={rankingPage.onPaginationChange}
          itemLabel="ambassadeur"
          onSelectedItemChange={(row) => row && setDialog({ kind: 'detail', row })}
        />
      </div>

      <div className="space-y-3">
        <h2 className="text-title font-display font-bold uppercase">Récompenses</h2>
        <OperationsList
          storageKey="ambassadors-rewards"
          data={rewardsPage.data}
          status={rewardsQuery.error ? 'error' : rewardsQuery.isLoading ? 'loading' : rewardsQuery.isFetching ? 'stale' : 'idle'}
          errorMessage={rewardsQuery.error?.message}
          onRetry={() => void rewardsQuery.refetch()}
          getItemId={(reward) => reward.id}
          columns={rewardColumns}
          rowActions={rewardActions}
          filters={rewardFilters}
          onFilterChange={(filterId, value) => {
            if (filterId === 'status') setRewardStatus(isRewardStatus(value) ? value : null)
          }}
          search={rewardSearch}
          searchPlaceholder="Ambassadeur, code ou récompense"
          onSearchChange={setRewardSearch}
          toolbarActions={
            <Button type="button" variant="outline" size="sm" onClick={() => void rewardsQuery.refetch()} disabled={rewardsQuery.isFetching}>
              <RefreshCw className={rewardsQuery.isFetching ? 'animate-spin' : undefined} />
              Actualiser
            </Button>
          }
          pagination={rewardsPage.pagination}
          onPaginationChange={rewardsPage.onPaginationChange}
          itemLabel="récompense"
        />
      </div>

      {dialog?.kind === 'detail' ? <AmbassadorDetailDialog ambassadorId={dialog.row.ambassador_id} onClose={() => setDialog(null)} /> : null}
      {dialog?.kind === 'codes' ? <AmbassadorCodesDialog ambassador={dialog.row} onClose={() => setDialog(null)} /> : null}
      {dialog?.kind === 'points' && programYear ? <AmbassadorPointsDialog ambassador={dialog.row} programYear={programYear} onClose={() => setDialog(null)} /> : null}
      {dialog?.kind === 'referral' ? <ManualReferralDialog ambassador={dialog.row} onClose={() => setDialog(null)} /> : null}
      {actions.dialog}
    </div>
  )
}
