'use client'

import { useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAdminLogs, type AdminLogsFilters } from '@/app/api/admin/logs/logsQueries'
import type { AdminRequestLog } from '@/types/AdminRequestLog'
import { cn } from '@/lib/utils'

const METHOD_OPTIONS = ['POST', 'PUT', 'PATCH', 'DELETE']

const STATUS_OPTIONS = [200, 201, 204, 400, 401, 403, 404, 409, 422, 429, 500]
const UNSET_VALUE = '__all__'

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'medium',
  })

const getMethodStyles = (method: string) => {
  switch (method.toUpperCase()) {
    case 'POST':
      return 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/40'
    case 'PUT':
      return 'bg-amber-500/20 text-amber-400 border border-amber-500/50'
    case 'PATCH':
      return 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
    case 'DELETE':
      return 'bg-rose-500/20 text-rose-400 border border-rose-500/50'
    default:
      return 'bg-muted text-muted-foreground border border-transparent'
  }
}

const getStatusStyles = (status: number) => {
  if (status >= 500) return 'bg-rose-500/20 text-rose-400 border border-rose-500/50'
  if (status >= 400) return 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
  if (status >= 200 && status < 300) return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
  return 'bg-muted text-muted-foreground border border-transparent'
}

const buildInitialFilters = (): AdminLogsFilters => ({
  limit: 150,
})

export function AdminLogsSection() {
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState<AdminLogsFilters>(buildInitialFilters)
  const [selectedLog, setSelectedLog] = useState<AdminRequestLog | null>(null)
  const { data, isLoading, isFetching, error } = useAdminLogs(filters)

  const logs: AdminRequestLog[] = data?.logs ?? []
  const count = data?.count ?? 0

  const handleFilterChange = <Key extends keyof AdminLogsFilters>(key: Key, value: AdminLogsFilters[Key]) => {
    setFilters((previous) => ({
      ...previous,
      [key]: value,
    }))
  }

  const resetFilters = () => {
    setFilters(buildInitialFilters())
    queryClient.invalidateQueries({ queryKey: ['admin', 'logs'] })
  }

  const activeFiltersCount = useMemo(() => {
    return Object.entries(filters).filter(([key, value]) => {
      if (key === 'limit') return false
      return Boolean(value)
    }).length
  }, [filters])

  return (
    <section className="space-y-6">
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle>Journal des actions</CardTitle>
          <p className="text-sm text-muted-foreground">
            Historique des requêtes sensibles (POST / PUT / DELETE) et transferts de billets.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <div className="space-y-1">
              <Label>Méthode</Label>
              <Select
                value={filters.method ?? UNSET_VALUE}
                onValueChange={(value) =>
                  handleFilterChange('method', value === UNSET_VALUE ? undefined : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Toutes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UNSET_VALUE}>Toutes</SelectItem>
                  {METHOD_OPTIONS.map((method) => (
                    <SelectItem key={method} value={method}>
                      {method}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Statut</Label>
              <Select
                value={filters.status ?? UNSET_VALUE}
                onValueChange={(value) =>
                  handleFilterChange('status', value === UNSET_VALUE ? undefined : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UNSET_VALUE}>Tous</SelectItem>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status} value={String(status)}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Utilisateur</Label>
              <Input
                placeholder="Email ou ID"
                value={filters.userEmail ?? ''}
                onChange={(event) => handleFilterChange('userEmail', event.target.value || undefined)}
              />
            </div>
            <div className="space-y-1">
              <Label>Action</Label>
              <Input
                placeholder="Type d'action"
                value={filters.actionType ?? ''}
                onChange={(event) => handleFilterChange('actionType', event.target.value || undefined)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <div className="space-y-1">
              <Label>Recherche libre</Label>
              <Input
                placeholder="Résumé, chemin, email…"
                value={filters.search ?? ''}
                onChange={(event) => handleFilterChange('search', event.target.value || undefined)}
              />
            </div>
            <div className="space-y-1">
              <Label>Date de début</Label>
              <Input
                type="date"
                value={filters.startDate ?? ''}
                onChange={(event) => handleFilterChange('startDate', event.target.value || undefined)}
              />
            </div>
            <div className="space-y-1">
              <Label>Date de fin</Label>
              <Input
                type="date"
                value={filters.endDate ?? ''}
                onChange={(event) => handleFilterChange('endDate', event.target.value || undefined)}
              />
            </div>
            <div className="space-y-1">
              <Label>Limite</Label>
              <Select
                value={String(filters.limit ?? 150)}
                onValueChange={(value) => handleFilterChange('limit', parseInt(value, 10))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[50, 100, 150, 250, 500].map((limitValue) => (
                    <SelectItem key={limitValue} value={String(limitValue)}>
                      {limitValue}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-muted/10 px-3 py-2 md:px-4">
            <div className="text-sm text-muted-foreground">
              {isLoading ? 'Chargement…' : `${count} événements trouvés`}
              {activeFiltersCount > 0 ? ` • ${activeFiltersCount} filtre${activeFiltersCount > 1 ? 's' : ''} actifs` : ''}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={resetFilters} size="sm">
                Réinitialiser
              </Button>
              <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ['admin', 'logs'] })} size="sm" disabled={isFetching}>
                Actualiser
              </Button>
            </div>
          </div>

          {error ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error.message}
            </div>
          ) : null}

          <div className="overflow-hidden rounded-xl border border-muted-foreground/20 bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quand</TableHead>
                  <TableHead>Résumé</TableHead>
                  <TableHead>Méthode</TableHead>
                  <TableHead>Chemin</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Durée</TableHead>
                  <TableHead>Utilisateur</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow
                    key={log.id}
                    className="cursor-pointer transition-colors hover:bg-muted/60"
                    onClick={() => setSelectedLog(log)}
                  >
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {formatDateTime(log.created_at)}
                    </TableCell>
                    <TableCell className="max-w-[360px] space-y-1 text-sm">
                      <p className="font-medium leading-tight text-foreground line-clamp-2">{log.summary}</p>
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        {log.action_type ? (
                          <span className="rounded-full bg-muted px-2 py-0.5 font-medium">
                            {log.action_type}
                          </span>
                        ) : null}
                        {log.error_message ? (
                          <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-rose-400">
                            {log.error_message}
                          </span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="min-w-[90px]">
                      <span
                        className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors ${getMethodStyles(log.method)}`}
                      >
                        {log.method}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[220px] truncate text-xs text-muted-foreground">
                      {log.path}
                    </TableCell>
                    <TableCell className="min-w-[90px]">
                      <span
                        className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusStyles(log.status_code)}`}
                      >
                        {log.status_code}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {log.duration_ms} ms
                    </TableCell>
                    <TableCell className="max-w-[180px] truncate text-xs text-muted-foreground">
                      {log.user_email || '—'}
                    </TableCell>
                  </TableRow>
                ))}
                {logs.length === 0 && !isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-sm text-muted-foreground">
                      Aucun log trouvé pour ces critères.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={Boolean(selectedLog)} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="w-[80vw] !max-w-none bg-[#232323]">
          <DialogHeader>
            <DialogTitle>Détail du log</DialogTitle>
            <DialogDescription>
              {selectedLog ? `${selectedLog.method} ${selectedLog.path}` : ''}
            </DialogDescription>
          </DialogHeader>
          {selectedLog ? (
            <div className="grid gap-4 text-sm">
              <div className="grid gap-1">
                <Label className="text-xs uppercase text-muted-foreground">Résumé</Label>
                <p className="font-medium">{selectedLog.summary}</p>
                {selectedLog.action_type ? (
                  <p className="text-xs text-muted-foreground">{selectedLog.action_type}</p>
                ) : null}
              </div>

              <div className="grid auto-rows-fr gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <InfoTile
                  label="Méthode"
                  value={selectedLog.method}
                  valueClassName={cn(
                    'inline-flex min-w-[64px] justify-center rounded-full px-2.5 py-1 text-xs font-semibold',
                    getMethodStyles(selectedLog.method),
                  )}
                />
                <InfoTile
                  label="Statut"
                  value={String(selectedLog.status_code)}
                  valueClassName={cn(
                    'inline-flex min-w-[64px] justify-center rounded-full px-2.5 py-1 text-xs font-semibold',
                    getStatusStyles(selectedLog.status_code),
                  )}
                />
                <InfoTile label="Durée" value={`${selectedLog.duration_ms} ms`} />
                <InfoTile label="Utilisateur" value={selectedLog.user_email || '—'} />
                <InfoTile label="Date" value={formatDateTime(selectedLog.created_at)} />
                <InfoTile label="Adresse IP" value={selectedLog.ip_address || '—'} />
              </div>

              <div className="grid gap-2">
                <Label className="text-xs uppercase text-muted-foreground">Chemin</Label>
                <code className="block max-w-full overflow-x-auto rounded-md bg-muted px-2 py-1 text-xs">
                {selectedLog.path}
              </code>
              </div>

              {selectedLog.query_params ? (
                <JsonBlock title="Query params" data={selectedLog.query_params} />
              ) : null}

              {selectedLog.body ? <JsonBlock title="Payload" data={selectedLog.body} /> : null}

              {selectedLog.metadata ? <JsonBlock title="Métadonnées" data={selectedLog.metadata} /> : null}

              {selectedLog.error_message ? (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  {selectedLog.error_message}
                </div>
              ) : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  )
}

interface InfoTileProps {
  label: string
  value: string
  className?: string
  valueClassName?: string
}

function InfoTile({ label, value, className, valueClassName }: InfoTileProps) {
  return (
    <div
      className={cn(
        'flex min-w-[160px] flex-col gap-1 rounded-lg border border-border/60 bg-muted/40 px-3 py-2 shadow-sm',
        className,
      )}
    >
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn('text-sm font-medium text-foreground break-words', valueClassName)}>{value}</p>
    </div>
  )
}

interface JsonBlockProps {
  title: string
  data: unknown
}

function JsonBlock({ title, data }: JsonBlockProps) {
  return (
    <div className="grid gap-1">
      <Label className="text-xs uppercase text-muted-foreground">{title}</Label>
      <pre className="max-h-64 overflow-auto rounded-md bg-muted/40 px-3 py-2 text-xs">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  )
}
