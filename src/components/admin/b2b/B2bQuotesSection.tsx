'use client'

import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader'
import {
  OperationsList,
  type OperationsListAction,
  type OperationsListColumn,
  type OperationsListFilter,
} from '@/components/admin/operations'
import {
  useAdminQuoteRequests,
  useUpdateQuoteRequestStatus,
  type AdminQuoteRequest,
} from '@/app/api/admin/b2b-quotes/b2bQuotesQueries'
import { labelOf, PROJECT_TYPES, QUOTE_STATUSES, TEAM_SIZES, type QuoteStatus } from '@/lib/b2b/quoteRequest'

const STATUS_BADGE_CLASS: Record<QuoteStatus, string> = {
  new: 'border-info/40 bg-info/15 text-info',
  contacted: 'border-warning/40 bg-warning/15 text-warning',
  quoted: 'border-primary/40 bg-primary/15 text-primary',
  won: 'border-success/40 bg-success/15 text-success',
  lost: 'border-destructive/40 bg-destructive/15 text-destructive',
}

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Paris' })

function StatusBadge({ status }: { status: QuoteStatus }) {
  return (
    <Badge variant="outline" className={STATUS_BADGE_CLASS[status]}>
      {labelOf(QUOTE_STATUSES, status)}
    </Badge>
  )
}

function RequestDetail({
  request,
  onStatus,
  pending,
}: {
  request: AdminQuoteRequest
  onStatus: (status: QuoteStatus) => void
  pending: boolean
}) {
  const rows: Array<[string, string | null]> = [
    ['Contact', request.full_name],
    ['E-mail', request.email],
    ['Téléphone', request.phone],
    ['Équipe', labelOf(TEAM_SIZES, request.team_size)],
    ['Projet', labelOf(PROJECT_TYPES, request.project_type)],
    ['Reçue le', formatDateTime(request.created_at)],
    ['Source', request.utm ? Object.entries(request.utm).map(([key, value]) => `${key}=${value}`).join(' · ') : request.source],
  ]
  return (
    <div className="space-y-6">
      <dl className="space-y-3 text-sm">
        {rows.map(([label, value]) =>
          value ? (
            <div key={label} className="grid grid-cols-[6rem_1fr] gap-3">
              <dt className="text-label font-semibold uppercase text-subtle">{label}</dt>
              <dd className="min-w-0 break-words">{value}</dd>
            </div>
          ) : null,
        )}
      </dl>
      {request.message ? (
        <div>
          <p className="text-label font-semibold uppercase text-subtle">Message</p>
          <p className="mt-2 whitespace-pre-wrap rounded-xl border border-border bg-card p-4 text-sm">{request.message}</p>
        </div>
      ) : null}
      <div>
        <p className="text-label font-semibold uppercase text-subtle">Statut</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {QUOTE_STATUSES.map((status) => (
            <Button
              key={status.value}
              type="button"
              size="sm"
              variant={request.status === status.value ? 'default' : 'outline'}
              disabled={pending || request.status === status.value}
              onClick={() => onStatus(status.value)}
            >
              {status.label}
            </Button>
          ))}
        </div>
      </div>
      <Button asChild variant="outline">
        <a href={`mailto:${request.email}?subject=${encodeURIComponent(`Overbound · ${request.company_name}`)}`}>Répondre par e-mail</a>
      </Button>
    </div>
  )
}

export function B2bQuotesSection() {
  const [searchTerm, setSearchTerm] = useState('')
  const deferredSearch = useDeferredValue(searchTerm.trim())
  const [status, setStatus] = useState<'all' | QuoteStatus>('all')
  const [limit, setLimit] = useState<25 | 50 | 100>(50)
  const [cursor, setCursor] = useState<string | null>(null)
  const [previousCursors, setPreviousCursors] = useState<string[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const { data, isLoading, isFetching, error, refetch } = useAdminQuoteRequests({
    cursor,
    limit,
    status,
    query: deferredSearch || undefined,
  })
  const updateStatus = useUpdateQuoteRequestStatus()

  useEffect(() => {
    setCursor(null)
    setPreviousCursors([])
  }, [deferredSearch, status, limit])

  const requests = data?.requests ?? []
  const selected = requests.find((request) => request.id === selectedId) ?? null

  const columns: OperationsListColumn<AdminQuoteRequest>[] = useMemo(
    () => [
      {
        id: 'company',
        header: 'Entreprise',
        cell: (request) => (
          <div className="min-w-0">
            <p className="font-medium">{request.company_name}</p>
            <p className="truncate text-xs text-muted-foreground">{request.full_name} · {request.email}</p>
          </div>
        ),
        mobileCell: (request) => <span className="font-medium">{request.company_name}</span>,
      },
      { id: 'status', header: 'Statut', mobile: 'summary', cell: (request) => <StatusBadge status={request.status} /> },
      {
        id: 'team',
        header: 'Équipe',
        mobile: 'summary',
        cell: (request) => labelOf(TEAM_SIZES, request.team_size),
      },
      { id: 'project', header: 'Projet', mobile: 'detail', cell: (request) => labelOf(PROJECT_TYPES, request.project_type) },
      { id: 'date', header: 'Reçue le', mobile: 'detail', cell: (request) => formatDateTime(request.created_at) },
    ],
    [],
  )

  const rowActions: OperationsListAction<AdminQuoteRequest>[] = [
    { id: 'open', label: 'Ouvrir', onSelect: (request) => setSelectedId(request.id) },
    ...QUOTE_STATUSES.map((target) => ({
      id: `status-${target.value}`,
      label: `Marquer : ${target.label}`,
      onSelect: (request: AdminQuoteRequest) => updateStatus.mutate({ id: request.id, status: target.value }),
      disabled: (request: AdminQuoteRequest) => request.status === target.value || updateStatus.isPending,
    })),
  ]

  const newCount = status === 'all' ? requests.filter((request) => request.status === 'new').length : null

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Billetterie"
        title="Demandes de devis entreprises"
        description={
          newCount
            ? `${newCount} nouvelle${newCount > 1 ? 's' : ''} demande${newCount > 1 ? 's' : ''} sur cette page. Reçues depuis /entreprises.`
            : 'Demandes reçues depuis la page /entreprises, de la plus récente à la plus ancienne.'
        }
      />

      {updateStatus.error ? (
        <Alert variant="destructive">
          <AlertDescription>{updateStatus.error.message || 'Impossible de mettre à jour le statut.'}</AlertDescription>
        </Alert>
      ) : null}

      <OperationsList
        data={{ items: requests, nextCursor: data?.page.nextCursor ?? null, total: data?.page.totalCount }}
        status={error ? 'error' : isLoading && !data ? 'loading' : isFetching ? 'stale' : 'idle'}
        errorMessage={error?.message}
        onRetry={() => void refetch()}
        getItemId={(request) => request.id}
        columns={columns}
        filters={[
          {
            id: 'status',
            label: 'Statut',
            value: status,
            allLabel: 'Tous les statuts',
            options: QUOTE_STATUSES.map((item) => ({ value: item.value, label: item.label })),
          },
          { id: 'limit', label: 'Lignes', value: String(limit), options: [25, 50, 100].map((value) => ({ value: String(value), label: String(value) })) },
        ] satisfies OperationsListFilter[]}
        onFilterChange={(id, value) => {
          if (id === 'status') setStatus((value || 'all') as 'all' | QuoteStatus)
          if (id === 'limit') setLimit(Number(value) as 25 | 50 | 100)
        }}
        search={searchTerm}
        searchPlaceholder="Rechercher une entreprise, un nom, un e-mail…"
        onSearchChange={setSearchTerm}
        rowActions={rowActions}
        pagination={{ cursor, previousCursors, nextCursor: data?.page.nextCursor ?? null, total: data?.page.totalCount, limit }}
        onPaginationChange={({ cursor: nextCursor, previousCursors: nextPrevious }) => {
          setCursor(nextCursor)
          setPreviousCursors(nextPrevious)
        }}
        itemLabel="demande"
        selectedItem={selected}
        onSelectedItemChange={(request) => setSelectedId(request?.id ?? null)}
        detailTitle={(request) => request.company_name}
        detailDescription={(request) => `${request.full_name} · ${formatDateTime(request.created_at)}`}
        renderDetail={(request) => (
          <RequestDetail
            request={request}
            pending={updateStatus.isPending}
            onStatus={(next) => updateStatus.mutate({ id: request.id, status: next })}
          />
        )}
      />
    </div>
  )
}
