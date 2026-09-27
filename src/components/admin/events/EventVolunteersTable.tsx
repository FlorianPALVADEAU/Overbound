'use client'

import { useMemo, useState } from 'react'
import { Mail, Phone, Search, RefreshCw, Clock, Users, Trash2 } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useAdminEventVolunteers, deleteAdminEventVolunteer } from '@/app/api/admin/events/eventsQueries'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface EventVolunteersTableProps {
  eventId: string
}

const formatDate = (value: string | null) =>
  value
    ? new Date(value).toLocaleString('fr-FR', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : '—'

export function EventVolunteersTable({ eventId }: EventVolunteersTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const {
    data: volunteers = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useAdminEventVolunteers(eventId)

  const handleDelete = async (volunteerId: string, volunteerName: string | null) => {
    const label = volunteerName ? `le bénévole "${volunteerName}"` : 'ce bénévole'
    if (!confirm(`Supprimer ${label} de cet événement ?`)) {
      return
    }

    setDeleteLoadingId(volunteerId)
    try {
      await deleteAdminEventVolunteer(volunteerId)
      queryClient.setQueryData(
        ['admin', 'events', eventId, 'volunteers'],
        (previous: typeof volunteers | undefined) =>
          (previous || []).filter((volunteer) => volunteer.id !== volunteerId),
      )
    } catch (err) {
      console.error('Erreur suppression bénévole:', err)
      alert('Erreur lors de la suppression du bénévole.')
    } finally {
      setDeleteLoadingId(null)
    }
  }

  const filteredVolunteers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return volunteers
    return volunteers.filter((volunteer) => {
      return [
        volunteer.full_name,
        volunteer.email,
        volunteer.preferred_mission,
        volunteer.availability,
      ]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(term))
    })
  }, [searchTerm, volunteers])

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {(error as Error).message || 'Impossible de charger les bénévoles pour cet événement.'}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-4 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold">Bénévoles associés</h3>
            <p className="text-sm text-muted-foreground">
              {volunteers.length} candidature{volunteers.length > 1 ? 's' : ''} bénévole
              {volunteers.length > 1 ? 's' : ''} reçue{volunteers.length > 1 ? 's' : ''}.
            </p>
          </div>
          <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end">
            {isFetching ? (
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4 animate-spin" />
                Actualisation…
              </span>
            ) : null}
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isFetching}
                className="shrink-0"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Rafraîchir
            </Button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Nom, email, mission…"
                aria-label="Rechercher un bénévole"
                className="pl-9"
              />
            </div>
          </div>
        </div>

        <div className="hidden min-w-0 overflow-hidden md:block">
          <Table className="table-fixed [&_td]:min-w-0 [&_td]:break-words [&_th]:truncate">
            <TableHeader>
              <TableRow>
                <TableHead>Bénévole</TableHead>
                <TableHead>Mission &amp; disponibilité</TableHead>
                <TableHead>Soumis le</TableHead>
              <TableHead className="w-[220px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                    <Clock className="mx-auto mb-3 h-6 w-6 animate-spin" />
                    Chargement des bénévoles…
                  </TableCell>
                </TableRow>
              ) : filteredVolunteers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                    <Users className="mx-auto mb-3 h-6 w-6" />
                    Aucun bénévole ne correspond à cette recherche.
                  </TableCell>
                </TableRow>
              ) : (
                filteredVolunteers.map((volunteer) => (
                  <TableRow key={volunteer.id}>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">{volunteer.full_name ?? '—'}</span>
                        <span className="text-xs text-muted-foreground">{volunteer.email}</span>
                        {volunteer.phone ? (
                          <span className="text-xs text-muted-foreground">{volunteer.phone}</span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="text-sm text-foreground">
                          {volunteer.preferred_mission ?? 'Mission à définir'}
                        </span>
                        {volunteer.availability ? (
                          <span className="text-xs text-muted-foreground">
                            {volunteer.availability}
                          </span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(volunteer.submitted_at ?? null)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button asChild variant="outline" size="sm">
                          <a href={`mailto:${volunteer.email}`}>
                            <Mail className="mr-2 h-4 w-4" />
                            Email
                          </a>
                        </Button>
                        {volunteer.phone ? (
                          <Button asChild variant="ghost" size="sm">
                            <a href={`tel:${volunteer.phone}`}>
                              <Phone className="mr-2 h-4 w-4" />
                              Appeler
                            </a>
                          </Button>
                        ) : null}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(volunteer.id, volunteer.full_name)}
                          disabled={deleteLoadingId === volunteer.id}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {deleteLoadingId === volunteer.id ? 'Suppression…' : 'Supprimer'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="space-y-3 md:hidden">
          {isLoading ? (
            <div className="py-10 text-center text-muted-foreground">
              <Clock className="mx-auto mb-3 h-6 w-6 animate-spin" />
              Chargement des bénévoles…
            </div>
          ) : filteredVolunteers.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">
              <Users className="mx-auto mb-3 h-6 w-6" />
              Aucun bénévole ne correspond à cette recherche.
            </div>
          ) : (
            filteredVolunteers.map((volunteer) => (
              <article key={volunteer.id} className="min-w-0 rounded-xl border bg-card p-4 shadow-sm">
                <div className="min-w-0 space-y-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{volunteer.full_name ?? 'Bénévole sans nom'}</p>
                    <a
                      href={`mailto:${volunteer.email}`}
                      className="block truncate text-sm text-muted-foreground hover:text-foreground"
                    >
                      {volunteer.email}
                    </a>
                    {volunteer.phone ? (
                      <a
                        href={`tel:${volunteer.phone}`}
                        className="block truncate text-sm text-muted-foreground hover:text-foreground"
                      >
                        {volunteer.phone}
                      </a>
                    ) : null}
                  </div>

                  <dl className="grid min-w-0 grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                    <div className="min-w-0">
                      <dt className="text-xs text-muted-foreground">Mission</dt>
                      <dd className="truncate">{volunteer.preferred_mission ?? 'Mission à définir'}</dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-xs text-muted-foreground">Disponibilité</dt>
                      <dd className="break-words text-muted-foreground">{volunteer.availability ?? '—'}</dd>
                    </div>
                  </dl>

                  <p className="text-xs text-muted-foreground">
                    Candidature soumise le {formatDate(volunteer.submitted_at ?? null)}
                  </p>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <Button asChild variant="outline" size="sm" className="w-full">
                      <a href={`mailto:${volunteer.email}`}>
                        <Mail className="mr-2 h-4 w-4" />
                        Envoyer un email
                      </a>
                    </Button>
                    {volunteer.phone ? (
                      <Button asChild variant="outline" size="sm" className="w-full">
                        <a href={`tel:${volunteer.phone}`}>
                          <Phone className="mr-2 h-4 w-4" />
                          Appeler
                        </a>
                      </Button>
                    ) : null}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full sm:col-span-2"
                      onClick={() => handleDelete(volunteer.id, volunteer.full_name)}
                      disabled={deleteLoadingId === volunteer.id}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {deleteLoadingId === volunteer.id ? 'Suppression…' : 'Supprimer la candidature'}
                    </Button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default EventVolunteersTable
