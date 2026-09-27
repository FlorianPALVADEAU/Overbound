'use client'

import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Plus, Users } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DeleteConfirmationDialog } from '@/components/admin/ui/DeleteConfirmationDialog'
import { OperationsList, type OperationsListAction, type OperationsListColumn } from '@/components/admin/operations'
import { BootcampFormDialog } from './BootcampFormDialog'
import { adminBootcampsQueryKey, createAdminBootcamp, deleteAdminBootcamp, updateAdminBootcamp, useAdminBootcampsPage } from '@/app/api/admin/bootcamps/bootcampsAdminQueries'
import type { Bootcamp, BootcampFormValues, BootcampWithRegistrants } from '@/types/Bootcamp'

interface MessageState { type: 'success' | 'error'; text: string }

export function BootcampsSection() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search.trim())
  const [cursor, setCursor] = useState<string | null>(null)
  const [previousCursors, setPreviousCursors] = useState<string[]>([])
  const { data: pageData, isLoading, isFetching, error } = useAdminBootcampsPage({ cursor, limit: 25, search: deferredSearch })
  const bootcamps = pageData?.items ?? []
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Bootcamp | null>(null)
  const [deleting, setDeleting] = useState<Bootcamp | null>(null)
  const [registrantsBootcamp, setRegistrantsBootcamp] = useState<BootcampWithRegistrants | null>(null)
  const [message, setMessage] = useState<MessageState | null>(null)
  useEffect(() => { setCursor(null); setPreviousCursors([]) }, [deferredSearch])
  const formatDate = (iso: string) => new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' }).format(new Date(iso))
  const isPast = (iso: string) => new Date(iso) < new Date()
  const notify = (next: MessageState) => { setMessage(next); setTimeout(() => setMessage(null), 4000) }
  const handleCreate = async (values: BootcampFormValues) => { await createAdminBootcamp(values); await queryClient.invalidateQueries({ queryKey: adminBootcampsQueryKey }); notify({ type: 'success', text: 'Bootcamp créé avec succès.' }) }
  const handleUpdate = async (values: BootcampFormValues) => { if (!editing) return; await updateAdminBootcamp(editing.id, values); await queryClient.invalidateQueries({ queryKey: adminBootcampsQueryKey }); setEditing(null); notify({ type: 'success', text: 'Bootcamp mis à jour.' }) }
  const handleDelete = async () => { if (!deleting) return; await deleteAdminBootcamp(deleting.id); await queryClient.invalidateQueries({ queryKey: adminBootcampsQueryKey }); setDeleting(null); notify({ type: 'success', text: 'Bootcamp supprimé.' }) }
  const columns = useMemo<OperationsListColumn<BootcampWithRegistrants>[]>(() => [
    { id: 'title', header: 'Titre', cell: (bootcamp) => <span className="font-medium">{bootcamp.title}</span> },
    { id: 'date', header: 'Date', cell: (bootcamp) => <span className="text-sm text-muted-foreground">{formatDate(bootcamp.starts_at)}</span> },
    { id: 'location', header: 'Lieu', cell: (bootcamp) => <span className="text-sm text-muted-foreground">{bootcamp.location_name}</span> },
    { id: 'registrants', header: 'Inscrits', cell: (bootcamp) => <Button type="button" variant="ghost" size="sm" className="gap-1" onClick={(event) => { event.stopPropagation(); setRegistrantsBootcamp(bootcamp) }}><Users className="h-4 w-4" />{bootcamp.registration_count ?? 0}</Button> },
    { id: 'status', header: 'Statut', cell: (bootcamp) => <Badge variant={isPast(bootcamp.starts_at) ? 'secondary' : 'default'}>{isPast(bootcamp.starts_at) ? 'Terminé' : 'À venir'}</Badge> },
  ], [])
  const rowActions: OperationsListAction<BootcampWithRegistrants>[] = [
    { id: 'registrants', label: 'Voir les inscrits', onSelect: setRegistrantsBootcamp },
    { id: 'edit', label: 'Modifier', onSelect: (bootcamp) => { setEditing(bootcamp); setFormOpen(true) } },
    { id: 'delete', label: 'Supprimer', destructive: true, onSelect: setDeleting },
  ]
  return <div className="space-y-6">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-xl font-semibold">Bootcamps</h2><p className="text-sm text-muted-foreground">Gérez les sessions d'entraînement et leurs inscrits.</p></div><Button onClick={() => { setEditing(null); setFormOpen(true) }}><Plus className="mr-2 h-4 w-4" />Nouveau bootcamp</Button></div>
    {message ? <Alert variant={message.type === 'error' ? 'destructive' : 'default'}><AlertDescription>{message.text}</AlertDescription></Alert> : null}
    {error ? <Alert variant="destructive"><AlertDescription>Impossible de charger les bootcamps : {error.message}</AlertDescription></Alert> : null}
    <OperationsList data={{ items: bootcamps, nextCursor: pageData?.nextCursor ?? null, total: pageData?.total }} status={error ? 'error' : isLoading && !pageData ? 'loading' : isFetching ? 'stale' : 'idle'} errorMessage={error?.message} onRetry={() => window.location.reload()} getItemId={(bootcamp) => bootcamp.id} columns={columns} rowActions={rowActions} search={search} searchPlaceholder="Rechercher un bootcamp…" onSearchChange={setSearch} pagination={{ cursor, previousCursors, nextCursor: pageData?.nextCursor ?? null, total: pageData?.total, limit: 25 }} onPaginationChange={({ cursor: nextCursor, previousCursors: nextPrevious }) => { setCursor(nextCursor); setPreviousCursors(nextPrevious) }} itemLabel="bootcamp" />
    <BootcampFormDialog open={formOpen} bootcamp={editing} onClose={() => { setFormOpen(false); setEditing(null) }} onSubmit={editing ? handleUpdate : handleCreate} />
    <DeleteConfirmationDialog open={Boolean(deleting)} onOpenChange={(open) => { if (!open) setDeleting(null) }} title="Supprimer ce bootcamp ?" entityName={deleting?.title ?? ''} entityType="le bootcamp" consequences={['Toutes les inscriptions associées']} onConfirm={handleDelete} />
    <Dialog open={Boolean(registrantsBootcamp)} onOpenChange={() => setRegistrantsBootcamp(null)}><DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto"><DialogHeader><DialogTitle>Inscrits — {registrantsBootcamp?.title}</DialogTitle></DialogHeader>{registrantsBootcamp ? <div className="space-y-3"><p className="text-sm text-muted-foreground">{registrantsBootcamp.registration_count ?? 0} participant{(registrantsBootcamp.registration_count ?? 0) !== 1 ? 's' : ''}</p>{registrantsBootcamp.registrants?.length ? registrantsBootcamp.registrants.map((registrant) => <div key={registrant.id} className="flex items-start justify-between gap-3 rounded-lg border p-3"><div className="min-w-0 truncate">{registrant.profile?.full_name ?? registrant.profile?.email ?? '—'}</div><div className="shrink-0 text-xs text-muted-foreground">{new Date(registrant.registered_at).toLocaleDateString('fr-FR')}</div></div>) : <p className="py-6 text-center text-sm text-muted-foreground">Aucun inscrit pour le moment.</p>}</div> : null}</DialogContent></Dialog>
  </div>
}
