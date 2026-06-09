'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Users, Calendar, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { DeleteConfirmationDialog } from '@/components/admin/ui/DeleteConfirmationDialog'
import { BootcampFormDialog } from './BootcampFormDialog'
import {
  adminBootcampsQueryKey,
  createAdminBootcamp,
  deleteAdminBootcamp,
  updateAdminBootcamp,
  useAdminBootcamps,
} from '@/app/api/admin/bootcamps/bootcampsAdminQueries'
import type { Bootcamp, BootcampFormValues, BootcampWithRegistrants } from '@/types/Bootcamp'

interface MessageState {
  type: 'success' | 'error'
  text: string
}

export function BootcampsSection() {
  const queryClient = useQueryClient()
  const { data: bootcamps, isLoading, error } = useAdminBootcamps()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Bootcamp | null>(null)
  const [deleting, setDeleting] = useState<Bootcamp | null>(null)
  const [registrantsBootcamp, setRegistrantsBootcamp] = useState<BootcampWithRegistrants | null>(null)
  const [message, setMessage] = useState<MessageState | null>(null)

  const notify = (msg: MessageState) => {
    setMessage(msg)
    setTimeout(() => setMessage(null), 4000)
  }

  const handleCreate = async (values: BootcampFormValues) => {
    await createAdminBootcamp(values)
    await queryClient.invalidateQueries({ queryKey: adminBootcampsQueryKey })
    notify({ type: 'success', text: 'Bootcamp créé avec succès.' })
  }

  const handleUpdate = async (values: BootcampFormValues) => {
    if (!editing) return
    await updateAdminBootcamp(editing.id, values)
    await queryClient.invalidateQueries({ queryKey: adminBootcampsQueryKey })
    notify({ type: 'success', text: 'Bootcamp mis à jour.' })
    setEditing(null)
  }

  const handleDelete = async () => {
    if (!deleting) return
    await deleteAdminBootcamp(deleting.id)
    await queryClient.invalidateQueries({ queryKey: adminBootcampsQueryKey })
    notify({ type: 'success', text: 'Bootcamp supprimé.' })
    setDeleting(null)
  }

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Paris',
    })

  const isPast = (iso: string) => new Date(iso) < new Date()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Bootcamps</h2>
          <p className="text-sm text-muted-foreground">
            Gérez les sessions d'entraînement et leurs inscrits.
          </p>
        </div>
        <Button onClick={() => { setEditing(null); setFormOpen(true) }}>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau bootcamp
        </Button>
      </div>

      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>Impossible de charger les bootcamps : {error.message}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-border/60 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titre</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Lieu</TableHead>
                <TableHead className="text-center">Inscrits</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(bootcamps ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                    Aucun bootcamp créé.
                  </TableCell>
                </TableRow>
              ) : (
                (bootcamps ?? []).map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{b.title}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(b.starts_at)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        {b.location_name}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-sm font-medium hover:bg-primary/10 hover:text-primary transition"
                        onClick={() => setRegistrantsBootcamp(b)}
                        title="Voir les inscrits"
                      >
                        <Users className="h-3.5 w-3.5" />
                        {b.registration_count ?? 0}
                      </button>
                    </TableCell>
                    <TableCell>
                      <Badge variant={isPast(b.starts_at) ? 'secondary' : 'default'}>
                        {isPast(b.starts_at) ? 'Terminé' : 'À venir'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setEditing(b); setFormOpen(true) }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleting(b)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Formulaire création / édition */}
      <BootcampFormDialog
        open={formOpen}
        bootcamp={editing}
        onClose={() => { setFormOpen(false); setEditing(null) }}
        onSubmit={editing ? handleUpdate : handleCreate}
      />

      {/* Confirmation suppression */}
      <DeleteConfirmationDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => { if (!open) setDeleting(null) }}
        title="Supprimer ce bootcamp ?"
        entityName={deleting?.title ?? ''}
        entityType="le bootcamp"
        consequences={['Toutes les inscriptions associées']}
        onConfirm={handleDelete}
      />

      {/* Liste des inscrits */}
      <Dialog open={Boolean(registrantsBootcamp)} onOpenChange={() => setRegistrantsBootcamp(null)}>
        <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Inscrits — {registrantsBootcamp?.title}
            </DialogTitle>
          </DialogHeader>

          {registrantsBootcamp && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {registrantsBootcamp.registration_count ?? 0} participant
                {(registrantsBootcamp.registration_count ?? 0) !== 1 ? 's' : ''}
              </p>

              {(registrantsBootcamp.registrants ?? []).length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Aucun inscrit pour le moment.
                </p>
              ) : (
                <div className="rounded-lg border border-border/60 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nom</TableHead>
                        <TableHead>Inscrit le</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {registrantsBootcamp.registrants.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell>{r.profile?.full_name ?? r.profile?.email ?? <span className="text-muted-foreground italic">—</span>}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(r.registered_at).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
