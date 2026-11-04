'use client'

import { useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { RefreshCw } from 'lucide-react'
import { useAdminAmbassadors } from '@/app/api/admin/ambassadors/ambassadorsQueries'
import { StatRow, type Stat } from '@/components/ds'
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader'
import { OperationsList, type OperationsListAction, type OperationsListColumn, type OperationsListFilter } from '@/components/admin/operations'
import { useClientPagination } from '@/components/admin/operations/clientPagination'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { AdminAmbassadorRow } from '@/lib/admin/ambassadors/types'
import { AMBASSADOR_HANDLING_OPTIONS, filterAmbassadorRows, isAmbassadorHandling, type AmbassadorHandling } from './ambassadorFilters'

const sheetHref = (ambassadorId: string) => `/dashboard/ambassadors/${encodeURIComponent(ambassadorId)}`
const spaceHref = (ambassadorId: string) => `/ambassadors/dashboard?as=${encodeURIComponent(ambassadorId)}`

/** Open rewards of one ambassador as badges: the team's work first, then the ambassador's. */
function RewardsBadges({ row }: { row: AdminAmbassadorRow }) {
  if (row.rewards_to_fulfil === 0 && row.rewards_to_claim === 0) return <span className="text-muted-foreground">—</span>
  return (
    <div className="flex flex-wrap gap-1.5">
      {row.rewards_to_fulfil > 0 ? <Badge className="border-warning/40 bg-warning/20 text-warning">{row.rewards_to_fulfil} à remettre</Badge> : null}
      {row.rewards_to_claim > 0 ? <Badge variant="outline">{row.rewards_to_claim} à réclamer</Badge> : null}
    </div>
  )
}

const rewardsText = (row: AdminAmbassadorRow) =>
  [row.rewards_to_fulfil > 0 ? `${row.rewards_to_fulfil} à remettre` : null, row.rewards_to_claim > 0 ? `${row.rewards_to_claim} à réclamer` : null]
    .filter(Boolean)
    .join(' · ') || '—'

const columns: OperationsListColumn<AdminAmbassadorRow>[] = [
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
  { id: 'code', mobile: 'detail', header: 'Code actif', cell: (row) => <span className="break-all font-mono text-xs">{row.ambassador_code ?? 'Aucun code actif'}</span> },
  {
    id: 'points',
    mobile: 'summary',
    header: 'Points',
    cell: (row) => <span className="font-semibold tabular-nums">{row.total_points} pts</span>,
    className: 'text-right',
    headerClassName: 'text-right',
  },
  { id: 'open', mobile: 'detail', header: 'Open', cell: (row) => <span className="tabular-nums">{row.recruits_open}</span>, className: 'text-right', headerClassName: 'text-right' },
  { id: 'ranked', mobile: 'detail', header: 'Ranked', cell: (row) => <span className="tabular-nums">{row.recruits_ranked}</span>, className: 'text-right', headerClassName: 'text-right' },
  { id: 'rewards', mobile: 'summary', header: 'Récompenses', cell: (row) => <RewardsBadges row={row} />, mobileCell: (row) => rewardsText(row) },
]

/**
 * Every ambassador of a season on one lean table. The rewards, referrals and history live on each sheet:
 * a row opens it, so this page never loads more than the list itself.
 */
export function AmbassadorsListPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('search')?.trim() ?? '')
  const [season, setSeason] = useState<number | null>(null)
  const [handling, setHandling] = useState<AmbassadorHandling>('all')
  const query = useAdminAmbassadors(season)

  const all = useMemo(() => query.data?.ambassadors ?? [], [query.data])
  const rows = useMemo(() => filterAmbassadorRows(all, search, handling), [all, search, handling])
  const page = useClientPagination(rows, `${search}|${season ?? ''}|${handling}`)

  const openSheet = (row: AdminAmbassadorRow) => router.push(sheetHref(row.ambassador_id))
  const rowActions: OperationsListAction<AdminAmbassadorRow>[] = [
    { id: 'sheet', label: 'Ouvrir la fiche', onSelect: openSheet },
    { id: 'space', label: 'Voir son espace ambassadeur', onSelect: (row) => window.open(spaceHref(row.ambassador_id), '_blank', 'noopener,noreferrer') },
  ]

  const filters: OperationsListFilter[] = [
    {
      id: 'handling',
      label: 'Afficher',
      value: handling === 'all' ? '' : handling,
      allLabel: 'Tous les ambassadeurs',
      options: AMBASSADOR_HANDLING_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
    },
  ]

  const stats: Stat[] = [
    { label: 'Ambassadeurs', value: all.length },
    { label: 'Récompenses à remettre', value: all.reduce((sum, row) => sum + row.rewards_to_fulfil, 0), highlight: true },
    { label: 'Récompenses à réclamer', value: all.reduce((sum, row) => sum + row.rewards_to_claim, 0) },
  ]

  return (
    <div className="grid gap-8">
      <AdminPageHeader
        eyebrow="Communauté"
        title="Ambassadeurs"
        description="Une ligne ouvre la fiche : récompenses, filleuls, codes et historique des corrections."
      />

      <StatRow stats={stats} compact />

      <OperationsList
        storageKey="ambassadors-list"
        data={page.data}
        status={query.error ? 'error' : query.isLoading ? 'loading' : query.isFetching ? 'stale' : 'idle'}
        errorMessage={query.error?.message}
        onRetry={() => void query.refetch()}
        getItemId={(row) => row.ambassador_id}
        columns={columns}
        rowActions={rowActions}
        filters={filters}
        onFilterChange={(filterId, value) => {
          if (filterId === 'handling') setHandling(value === '' || !isAmbassadorHandling(value) ? 'all' : value)
        }}
        search={search}
        searchPlaceholder="Nom ou code promo"
        onSearchChange={setSearch}
        toolbarActions={
          <>
            <Select value={query.data ? String(query.data.program_year) : ''} onValueChange={(value) => setSeason(Number(value))} disabled={!query.data}>
              <SelectTrigger className="w-40" aria-label="Saison"><SelectValue placeholder="Saison" /></SelectTrigger>
              <SelectContent>
                {(query.data?.available_program_years ?? []).map((year) => <SelectItem key={year} value={String(year)}>Saison {year}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button type="button" variant="outline" size="sm" onClick={() => void query.refetch()} disabled={query.isFetching}>
              <RefreshCw className={query.isFetching ? 'animate-spin' : undefined} />
              Actualiser
            </Button>
          </>
        }
        pagination={page.pagination}
        onPaginationChange={page.onPaginationChange}
        itemLabel="ambassadeur"
        onSelectedItemChange={(row) => {
          if (row) openSheet(row)
        }}
      />
    </div>
  )
}
