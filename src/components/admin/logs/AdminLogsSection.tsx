'use client'

import { useDeferredValue, useEffect, useRef, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { useAdminLogs } from '@/app/api/admin/logs/logsQueries'
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader'
import { OperationsList, type OperationsListColumn, type OperationsListFilter } from '@/components/admin/operations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LOG_METHODS } from '@/lib/admin/logsList'
import { cn } from '@/lib/utils'
import type { AdminRequestLog } from '@/types/AdminRequestLog'

const STATUS_OPTIONS = [200, 201, 204, 400, 401, 403, 404, 409, 422, 429, 500]
const LIMITS = [50, 100, 200]
const PILL = 'inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-semibold'

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'medium', timeZone: 'Europe/Paris' }).format(new Date(value))

const getMethodStyles = (method: string) => {
  switch (method.toUpperCase()) {
    case 'POST':
      return 'border-success/40 bg-success/20 text-success'
    case 'PUT':
      return 'border-warning/50 bg-warning/20 text-warning'
    case 'PATCH':
      return 'border-info/40 bg-info/20 text-info'
    case 'DELETE':
      return 'border-destructive/50 bg-destructive/20 text-destructive'
    default:
      return 'border-transparent bg-muted text-muted-foreground'
  }
}

const getStatusStyles = (status: number) => {
  if (status >= 500) return 'border-destructive/50 bg-destructive/20 text-destructive'
  if (status >= 400) return 'border-warning/40 bg-warning/20 text-warning'
  if (status >= 200 && status < 300) return 'border-success/30 bg-success/20 text-success'
  return 'border-transparent bg-muted text-muted-foreground'
}

const columns: OperationsListColumn<AdminRequestLog>[] = [
  {
    id: 'summary',
    header: 'Résumé',
    cell: (log) => (
      <>
        <p className="font-medium">{log.summary}</p>
        {log.action_type ? <p className="text-xs text-muted-foreground">{log.action_type}</p> : null}
        {log.error_message ? <p className="text-xs text-destructive">{log.error_message}</p> : null}
      </>
    ),
    mobileCell: (log) => <span className="line-clamp-2 font-medium">{log.summary}</span>,
  },
  { id: 'date', mobile: 'summary', header: 'Quand', cell: (log) => <span className="whitespace-nowrap text-xs">{formatDateTime(log.created_at)}</span> },
  {
    id: 'method',
    mobile: 'summary',
    header: 'Méthode',
    cell: (log) => <span className={cn(PILL, getMethodStyles(log.method))}>{log.method}</span>,
  },
  {
    id: 'status',
    mobile: 'summary',
    header: 'Statut',
    cell: (log) => <span className={cn(PILL, getStatusStyles(log.status_code))}>{log.status_code}</span>,
  },
  { id: 'path', mobile: 'detail', header: 'Chemin', cell: (log) => <span className="break-all font-mono text-xs">{log.path}</span> },
  { id: 'user', mobile: 'detail', header: 'Utilisateur', cell: (log) => <span className="break-all text-xs">{log.user_email || '—'}</span> },
  { id: 'duration', mobile: 'detail', header: 'Durée', cell: (log) => <span className="whitespace-nowrap text-xs">{log.duration_ms} ms</span>, hiddenByDefault: true },
  { id: 'ip', mobile: 'detail', header: 'Adresse IP', cell: (log) => <span className="font-mono text-xs">{log.ip_address || '—'}</span>, hiddenByDefault: true },
]

/** Journal of the admin's write requests: who did what, when, and how it ended. */
export function AdminLogsSection() {
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search.trim())
  const [method, setMethod] = useState<string | null>(null)
  const [status, setStatus] = useState<number | null>(null)
  const [limit, setLimit] = useState(100)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [cursor, setCursor] = useState<string | null>(null)
  const [previousCursors, setPreviousCursors] = useState<string[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const hasInitializedFilters = useRef(false)

  // A new filter starts again from the first page.
  useEffect(() => {
    if (!hasInitializedFilters.current) {
      hasInitializedFilters.current = true
      return
    }
    setCursor(null)
    setPreviousCursors([])
  }, [deferredSearch, method, status, limit, startDate, endDate])

  const { data, error, isLoading, isFetching, refetch } = useAdminLogs({
    cursor,
    limit,
    method,
    status,
    query: deferredSearch || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  })
  const logs = data?.logs ?? []
  const selected = logs.find((log) => log.id === selectedId) ?? null

  const filters: OperationsListFilter[] = [
    { id: 'method', label: 'Méthode', value: method ?? '', allLabel: 'Toutes les méthodes', options: LOG_METHODS.map((value) => ({ value, label: value })) },
    { id: 'status', label: 'Statut', value: status ? String(status) : '', allLabel: 'Tous les statuts', options: STATUS_OPTIONS.map((value) => ({ value: String(value), label: String(value) })) },
    { id: 'limit', label: 'Lignes', value: String(limit), options: LIMITS.map((value) => ({ value: String(value), label: String(value) })) },
  ]

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Système"
        title="Journal des actions"
        description="Historique des requêtes sensibles (POST, PUT, PATCH, DELETE) et transferts de billets."
      />
      <OperationsList
        storageKey="logs"
        data={{ items: logs, nextCursor: data?.page.nextCursor ?? null, total: data?.page.totalCount }}
        status={error ? 'error' : isLoading && !data ? 'loading' : isFetching ? 'stale' : 'idle'}
        errorMessage={error?.message}
        onRetry={() => void refetch()}
        getItemId={(log) => log.id}
        columns={columns}
        filters={filters}
        onFilterChange={(filterId, value) => {
          if (filterId === 'method') setMethod(value || null)
          if (filterId === 'status') setStatus(value ? Number(value) : null)
          if (filterId === 'limit') setLimit(Number(value))
        }}
        search={search}
        searchPlaceholder="Résumé, chemin, e-mail, action ou erreur"
        onSearchChange={setSearch}
        toolbarActions={
          <>
            <div className="flex items-center gap-2">
              <Label htmlFor="logs-start" className="text-label font-semibold uppercase text-subtle">Du</Label>
              <Input id="logs-start" type="date" className="w-40" value={startDate} max={endDate || undefined} onChange={(event) => setStartDate(event.target.value)} />
              <Label htmlFor="logs-end" className="text-label font-semibold uppercase text-subtle">au</Label>
              <Input id="logs-end" type="date" className="w-40" value={endDate} min={startDate || undefined} onChange={(event) => setEndDate(event.target.value)} />
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => void refetch()} disabled={isFetching}>
              <RefreshCw className={isFetching ? 'animate-spin' : undefined} />
              Actualiser
            </Button>
          </>
        }
        pagination={{ cursor, previousCursors, nextCursor: data?.page.nextCursor ?? null, total: data?.page.totalCount, limit }}
        onPaginationChange={({ cursor: nextCursor, previousCursors: nextPrevious }) => {
          setCursor(nextCursor)
          setPreviousCursors(nextPrevious)
        }}
        itemLabel="log"
        selectedItem={selected}
        onSelectedItemChange={(log) => setSelectedId(log?.id ?? null)}
        detailTitle={(log) => log.summary}
        detailDescription={(log) => `${log.method} ${log.path}`}
        renderDetail={(log) => (
          <div className="space-y-4 text-sm">
            <dl className="grid gap-3 sm:grid-cols-2">
              <Info label="Date" value={formatDateTime(log.created_at)} />
              <Info label="Durée" value={`${log.duration_ms} ms`} />
              <Info label="Méthode" value={log.method} />
              <Info label="Statut" value={String(log.status_code)} />
              <Info label="Utilisateur" value={log.user_email || '—'} />
              <Info label="Adresse IP" value={log.ip_address || '—'} />
              {log.action_type ? <Info label="Action" value={log.action_type} /> : null}
            </dl>
            <Info label="Chemin" value={log.path} mono />
            {log.error_message ? (
              <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{log.error_message}</p>
            ) : null}
            {log.query_params ? <JsonBlock title="Query params" data={log.query_params} /> : null}
            {log.body ? <JsonBlock title="Payload" data={log.body} /> : null}
            {log.metadata ? <JsonBlock title="Métadonnées" data={log.metadata} /> : null}
          </div>
        )}
      />
    </div>
  )
}

function Info({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="space-y-1">
      <dt className="text-label font-semibold uppercase text-subtle">{label}</dt>
      <dd className={cn('break-all font-medium', mono && 'font-mono text-xs')}>{value}</dd>
    </div>
  )
}

function JsonBlock({ title, data }: { title: string; data: unknown }) {
  return (
    <div className="space-y-1">
      <p className="text-label font-semibold uppercase text-subtle">{title}</p>
      <pre className="max-h-64 overflow-auto rounded-xl bg-muted/40 px-3 py-2 text-xs">{JSON.stringify(data, null, 2)}</pre>
    </div>
  )
}
