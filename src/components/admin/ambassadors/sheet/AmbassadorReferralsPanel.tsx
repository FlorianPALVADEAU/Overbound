'use client'

import { useAdminAmbassadorReferrals } from '@/app/api/admin/ambassadors/ambassadorsQueries'
import { OperationsList, type OperationsListColumn } from '@/components/admin/operations'
import { useClientPagination } from '@/components/admin/operations/clientPagination'
import type { AdminAmbassadorReferralRow } from '@/lib/admin/ambassadors/types'
import { formatDateTime, PAYMENT_STATUS_LABELS, POINTS_STATUS_LABELS, RACE_FORMAT_LABELS } from '../rewardStatus'

const columns: OperationsListColumn<AdminAmbassadorReferralRow>[] = [
  { id: 'name', header: 'Filleul', cell: (row) => <p className="font-semibold">{row.name ?? '—'}</p> },
  { id: 'signup', mobile: 'summary', header: 'Inscription', cell: (row) => formatDateTime(row.signup_date) },
  { id: 'format', header: 'Format', cell: (row) => RACE_FORMAT_LABELS[row.race_format] },
  { id: 'payment', header: 'Paiement', cell: (row) => PAYMENT_STATUS_LABELS[row.payment_status] },
  {
    id: 'points',
    mobile: 'summary',
    header: 'Points',
    cell: (row) => <span className="tabular-nums">{row.points_status === 'counted' ? `+${row.points}` : POINTS_STATUS_LABELS[row.points_status]}</span>,
    className: 'text-right',
    headerClassName: 'text-right',
  },
]

/** Referrals, with the rules of the ambassador's own dashboard. The note says when a past season is shown. */
export function AmbassadorReferralsPanel({ ambassadorId, isCurrentSeason }: { ambassadorId: string; isCurrentSeason: boolean }) {
  const query = useAdminAmbassadorReferrals(ambassadorId)
  const rows = query.data?.referrals ?? []
  const page = useClientPagination(rows, ambassadorId)

  return (
    <div className="grid gap-3">
      {isCurrentSeason ? null : (
        <p className="text-sm text-muted-foreground">Filleuls vus comme sur le tableau de bord ambassadeur : saison en cours, sans filtre par saison.</p>
      )}
      <OperationsList
        storageKey="ambassador-referrals"
        data={page.data}
        status={query.error ? 'error' : query.isLoading ? 'loading' : query.isFetching ? 'stale' : 'idle'}
        errorMessage={query.error?.message}
        onRetry={() => void query.refetch()}
        getItemId={(row) => row.id}
        columns={columns}
        pagination={page.pagination}
        onPaginationChange={page.onPaginationChange}
        itemLabel="filleul"
        emptyState={<p className="p-4 text-sm text-muted-foreground">Aucun filleul pour la saison en cours.</p>}
      />
    </div>
  )
}
