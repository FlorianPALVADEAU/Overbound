'use client'

import { useDeferredValue, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MoreHorizontal, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Race } from '@/types/Race'
import type { Obstacle } from '@/types/Obstacle'
import { RaceFormDialog, type RaceFormValues } from './RaceFormDialog'
import {
  adminRacesQueryKey,
  createAdminRace,
  deleteAdminRace,
  updateAdminRace,
  useAdminRacesPage,
  type AdminRacePayload,
  type DeleteRaceConflict,
} from '@/app/api/admin/races/racesQueries'
import { useAdminObstacles } from '@/app/api/admin/obstacles/obstaclesQueries'
import { DeleteConfirmationDialog } from '@/components/admin/ui/DeleteConfirmationDialog'
import { OperationsList, type OperationsListColumn } from '@/components/admin/operations'

interface MessageState {
  type: 'success' | 'error'
  text: string
}

function buildFormValues(race?: Race): RaceFormValues {
  if (!race) {
    return {
      name: '',
      logo_url: '',
      type: 'trail',
      difficulty: '5',
      target_public: 'intermédiaire',
      distance_km: '10',
      description: '',
      is_universal: false,
      obstacle_ids: [],
    }
  }

  return {
    name: race.name,
    logo_url: race.logo_url || '',
    type: race.type,
    difficulty: race.difficulty.toString(),
    target_public: race.target_public,
    distance_km: race.distance_km?.toString() || '0',
    description: race.description || '',
    is_universal: race.is_universal,
    obstacle_ids: race.obstacles?.map(({ obstacle }) => obstacle.id) || [],
  }
}

const formatDateTime = (value: string) =>
  new Date(value).toLocaleDateString('fr-FR', {
    dateStyle: 'medium',
  })

export function RacesSection() {
  const queryClient = useQueryClient()
  const [cursor, setCursor] = useState<string | null>(null)
  const [previousCursors, setPreviousCursors] = useState<string[]>([])
  const [limit, setLimit] = useState<25 | 50 | 100>(50)
  const [sort, setSort] = useState<'created_at' | 'name' | 'difficulty' | 'distance_km'>('created_at')
  const [direction, setDirection] = useState<'asc' | 'desc'>('desc')
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | Race['type']>('all')
  const deferredSearch = useDeferredValue(searchTerm.trim())
  const { data: racesPage, isLoading: racesLoading, isFetching: racesFetching, error: racesError } = useAdminRacesPage({ cursor, limit, query: deferredSearch, type: typeFilter === 'all' ? undefined : typeFilter, sort, direction })
  const races = racesPage?.races ?? []
  const {
    data: obstacles = [],
    isLoading: obstaclesLoading,
    error: obstaclesError,
  } = useAdminObstacles()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create')
  const [selectedRace, setSelectedRace] = useState<Race | null>(null)
  const [formValues, setFormValues] = useState<RaceFormValues>(buildFormValues())
  const [submitting, setSubmitting] = useState(false)
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null)
  const [message, setMessage] = useState<MessageState | null>(null)
  const resetPagination = () => { setCursor(null); setPreviousCursors([]) }

  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [raceToDelete, setRaceToDelete] = useState<Race | null>(null)
  const [deleteConflict, setDeleteConflict] = useState<DeleteRaceConflict | null>(null)

  const combinedLoading = racesLoading || obstaclesLoading
  const combinedError = racesError || obstaclesError

  const filteredRaces = races

  const handleCreateClick = () => {
    setDialogMode('create')
    setSelectedRace(null)
    setFormValues(buildFormValues())
    setDialogOpen(true)
  }

  const handleEdit = (race: Race) => {
    setDialogMode('edit')
    setSelectedRace(race)
    setFormValues(buildFormValues(race))
    setDialogOpen(true)
  }

  const handleDeleteClick = (race: Race) => {
    setRaceToDelete(race)
    setDeleteConflict(null)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!raceToDelete) return

    setDeleteLoadingId(raceToDelete.id)
    try {
      await deleteAdminRace(raceToDelete.id, deleteConflict !== null)
      queryClient.setQueryData<Race[]>(adminRacesQueryKey, (previous) => {
        if (!previous) return []
        return previous.filter((item) => item.id !== raceToDelete.id)
      })
      setMessage({ type: 'success', text: 'Course supprimée avec succès' })
      setDeleteDialogOpen(false)
      setRaceToDelete(null)
      setDeleteConflict(null)
    } catch (error) {
      const err = error as Error & DeleteRaceConflict
      if (err.requiresConfirmation && !deleteConflict) {
        setDeleteConflict({
          ticketsCount: err.ticketsCount,
          eventsCount: err.eventsCount,
          requiresConfirmation: true,
        })
      } else {
        const text = axios.isAxiosError(error)
          ? error.response?.data?.error || error.message
          : (error as Error).message || 'Erreur lors de la suppression'
        setMessage({ type: 'error', text })
        setDeleteDialogOpen(false)
        setRaceToDelete(null)
        setDeleteConflict(null)
      }
    } finally {
      setDeleteLoadingId(null)
    }
  }

  const handleSubmit = async (values: RaceFormValues) => {
    if (!values.name || !values.type || !values.target_public || !values.distance_km) {
      setMessage({ type: 'error', text: 'Veuillez remplir tous les champs obligatoires' })
      return
    }

    setSubmitting(true)
    setMessage(null)

    const payload: AdminRacePayload = {
      name: values.name,
      logo_url: values.logo_url || null,
      type: values.type,
      difficulty: parseInt(values.difficulty, 10) || 5,
      target_public: values.target_public,
      distance_km: parseFloat(values.distance_km) || 0,
      description: values.description || null,
      is_universal: values.is_universal,
      obstacle_ids: values.obstacle_ids,
    }

    try {
      if (dialogMode === 'create') {
        const created = await createAdminRace(payload)
        queryClient.setQueryData<Race[]>(adminRacesQueryKey, (previous) => {
          if (!previous) return [created]
          return [created, ...previous]
        })
        setMessage({ type: 'success', text: 'Course créée avec succès' })
      } else if (selectedRace) {
        const updated = await updateAdminRace(selectedRace.id, payload)
        queryClient.setQueryData<Race[]>(adminRacesQueryKey, (previous) => {
          if (!previous) return [updated]
          return previous.map((item) => (item.id === selectedRace.id ? updated : item))
        })
        setMessage({ type: 'success', text: 'Course mise à jour avec succès' })
      }

      setDialogOpen(false)
      setSelectedRace(null)
    } catch (error) {
      const text = axios.isAxiosError(error)
        ? error.response?.data?.error || error.message
        : (error as Error).message || 'Erreur lors de la sauvegarde'
      setMessage({ type: 'error', text })
    } finally {
      setSubmitting(false)
    }
  }

  const columns: OperationsListColumn<Race>[] = useMemo(() => {
    return [
      {
        id: 'name',
        header: 'Format',
        cell: (race) => (
          <div className="flex flex-col gap-1">
            <span className="font-semibold">{race.name}</span>
            {race.description ? (
              <span className="text-xs text-muted-foreground line-clamp-1">
                {race.description}
              </span>
            ) : null}
          </div>
        ),
      },
      {
        id: 'type',
        header: 'Type & public',
        cell: (race) => (
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="capitalize">
              {race.type}
            </Badge>
            <Badge variant="outline" className="capitalize">
              {race.target_public}
            </Badge>
          </div>
        ),
      },
      {
        id: 'distance',
        header: 'Distance',
        cell: (race) => (
          <span>
            {race.distance_km ? `${race.distance_km} km` : '—'}
          </span>
        ),
      },
      {
        id: 'difficulty',
        header: 'Difficulté',
        cell: (race) => (
          <span>
            {race.difficulty}/10
          </span>
        ),
      },
      {
        id: 'obstacles',
        header: 'Obstacles',
        cell: (race) => (
          <span>
            {race.obstacles?.length ?? 0} obstacle{(race.obstacles?.length ?? 0) > 1 ? 's' : ''}
          </span>
        ),
      },
      {
        id: 'updated',
        header: 'Mise à jour',
        cell: (race) => (
          <span className="text-sm text-muted-foreground">{formatDateTime(race.updated_at)}</span>
        ),
      },
      {
        id: 'actions',
        header: '',
        className: 'w-[160px]',
        cell: (race) => (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9" aria-label={`Actions pour ${race.name}`}>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => handleEdit(race)}>
                  <Pencil className="h-4 w-4" />
                  Modifier
                </DropdownMenuItem>
                <DropdownMenuItem variant="destructive" onSelect={() => handleDeleteClick(race)} disabled={deleteLoadingId === race.id}>
                  <Trash2 className="h-4 w-4" />
                  {deleteLoadingId === race.id ? 'Suppression…' : 'Supprimer'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ]
  }, [deleteLoadingId])

  const alertVariant = message?.type === 'error' ? 'destructive' : 'default'

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Formats de course</h2>
          <p className="text-muted-foreground">
            Gère les formats, leurs obstacles et leurs cibles.
          </p>
        </div>
        <Button onClick={handleCreateClick}>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau format
        </Button>
      </div>

      {message && (
        <Alert variant={alertVariant}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {combinedError ? (
        <Alert variant="destructive">
          <AlertDescription>
            {(combinedError as Error).message || 'Impossible de charger les formats'}
          </AlertDescription>
        </Alert>
      ) : null}

      <OperationsList
        data={{ items: filteredRaces, nextCursor: racesPage?.page.nextCursor ?? null, total: racesPage?.page.totalCount }}
        status={combinedError ? 'error' : combinedLoading && !racesPage ? 'loading' : racesFetching ? 'stale' : 'idle'}
        errorMessage={(combinedError as Error | null)?.message}
        onRetry={() => window.location.reload()}
        getItemId={(race) => race.id}
        columns={columns.filter((column) => column.id !== 'actions')}
        filters={[
          { id: 'type', label: 'Type', value: typeFilter === 'all' ? '' : typeFilter, allLabel: 'Tous les types', options: ['trail', 'obstacle', 'urbain', 'nature', 'extreme'].map((value) => ({ value, label: value })) },
          { id: 'sort', label: 'Trier par', value: sort, options: [{ value: 'created_at', label: 'Date de création' }, { value: 'name', label: 'Nom' }, { value: 'difficulty', label: 'Difficulté' }, { value: 'distance_km', label: 'Distance' }] },
          { id: 'direction', label: 'Ordre', value: direction, options: [{ value: 'desc', label: 'Décroissant' }, { value: 'asc', label: 'Croissant' }] },
          { id: 'limit', label: 'Lignes', value: String(limit), options: [25, 50, 100].map((value) => ({ value: String(value), label: String(value) })) },
        ]}
        onFilterChange={(id, value) => { resetPagination(); if (id === 'type') setTypeFilter((value || 'all') as typeof typeFilter); if (id === 'sort') setSort(value as typeof sort); if (id === 'direction') setDirection(value as typeof direction); if (id === 'limit') setLimit(Number(value) as typeof limit) }}
        search={searchTerm}
        searchPlaceholder="Rechercher par nom, public ou description…"
        onSearchChange={(value) => { setSearchTerm(value); resetPagination() }}
        rowActions={[
          { id: 'edit', label: 'Modifier', onSelect: handleEdit },
          { id: 'delete', label: 'Supprimer', destructive: true, onSelect: handleDeleteClick, disabled: (race) => deleteLoadingId === race.id },
        ]}
        pagination={{ cursor, previousCursors, nextCursor: racesPage?.page.nextCursor ?? null, total: racesPage?.page.totalCount, limit }}
        onPaginationChange={({ cursor: nextCursor, previousCursors: nextPreviousCursors }) => { setCursor(nextCursor); setPreviousCursors(nextPreviousCursors) }}
        itemLabel="format"
      />

      <RaceFormDialog
        open={dialogOpen}
        mode={dialogMode}
        initialValues={formValues}
        loading={submitting}
        obstacles={obstacles as Obstacle[]}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
      />

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open)
          if (!open) {
            setRaceToDelete(null)
            setDeleteConflict(null)
          }
        }}
        title="Supprimer la course"
        entityName={raceToDelete?.name ?? ''}
        entityType="la course"
        warningMessage={
          deleteConflict
            ? `Attention : cette course est utilisée par d'autres éléments.`
            : undefined
        }
        consequences={
          deleteConflict
            ? [
                deleteConflict.ticketsCount > 0
                  ? `${deleteConflict.ticketsCount} ticket(s) (et leurs inscriptions)`
                  : null,
                deleteConflict.eventsCount > 0
                  ? `${deleteConflict.eventsCount} association(s) événement-course`
                  : null,
              ].filter(Boolean) as string[]
            : undefined
        }
        onConfirm={handleDelete}
        loading={deleteLoadingId === raceToDelete?.id}
      />
    </div>
  )
}
