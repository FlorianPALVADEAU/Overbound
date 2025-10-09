'use client'

import { useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Search } from 'lucide-react'
import { AdminDataGrid, type AdminDataGridColumn } from '@/components/admin/ui/AdminDataGrid'
import type { Race } from '@/types/Race'
import type { Obstacle } from '@/types/Obstacle'
import { RaceFormDialog, type RaceFormValues } from './RaceFormDialog'
import {
  adminRacesQueryKey,
  createAdminRace,
  deleteAdminRace,
  updateAdminRace,
  useAdminRaces,
  type AdminRacePayload,
} from '@/app/api/admin/races/racesQueries'
import { useAdminObstacles } from '@/app/api/admin/obstacles/obstaclesQueries'

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
    obstacle_ids: race.obstacles?.map(({ obstacle }) => obstacle.id) || [],
  }
}

const formatDateTime = (value: string) =>
  new Date(value).toLocaleDateString('fr-FR', {
    dateStyle: 'medium',
  })

export function RacesSection() {
  const queryClient = useQueryClient()
  const {
    data: races = [],
    isLoading: racesLoading,
    error: racesError,
  } = useAdminRaces()
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
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | Race['type']>('all')

  const combinedLoading = racesLoading || obstaclesLoading
  const combinedError = racesError || obstaclesError

  const filteredRaces = useMemo(() => {
    let result = [...races]

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      result = result.filter((race) => {
        return (
          race.name.toLowerCase().includes(term) ||
          race.target_public.toLowerCase().includes(term) ||
          race.description?.toLowerCase().includes(term)
        )
      })
    }

    if (typeFilter !== 'all') {
      result = result.filter((race) => race.type === typeFilter)
    }

    return result
  }, [races, searchTerm, typeFilter])

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

  const handleDelete = async (race: Race) => {
    if (!confirm(`Supprimer la course "${race.name}" ?`)) {
      return
    }

    setDeleteLoadingId(race.id)
    try {
      await deleteAdminRace(race.id)
      queryClient.setQueryData<Race[]>(adminRacesQueryKey, (previous) => {
        if (!previous) return []
        return previous.filter((item) => item.id !== race.id)
      })
      setMessage({ type: 'success', text: 'Course supprimée avec succès' })
    } catch (error) {
      const text = axios.isAxiosError(error)
        ? error.response?.data?.error || error.message
        : (error as Error).message || 'Erreur lors de la suppression'
      setMessage({ type: 'error', text })
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

  const columns = useMemo<AdminDataGridColumn<Race>[]>(() => {
    return [
      {
        key: 'name',
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
        key: 'type',
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
        key: 'distance',
        header: 'Distance',
        cell: (race) => (
          <span>
            {race.distance_km ? `${race.distance_km} km` : '—'}
          </span>
        ),
      },
      {
        key: 'difficulty',
        header: 'Difficulté',
        cell: (race) => (
          <span>
            {race.difficulty}/10
          </span>
        ),
      },
      {
        key: 'obstacles',
        header: 'Obstacles',
        cell: (race) => (
          <span>
            {race.obstacles?.length ?? 0} obstacle{(race.obstacles?.length ?? 0) > 1 ? 's' : ''}
          </span>
        ),
      },
      {
        key: 'updated',
        header: 'Mise à jour',
        cell: (race) => (
          <span className="text-sm text-muted-foreground">{formatDateTime(race.updated_at)}</span>
        ),
      },
      {
        key: 'actions',
        header: '',
        className: 'w-[160px]',
        cell: (race) => (
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => handleEdit(race)}>
              Modifier
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleDelete(race)}
              disabled={deleteLoadingId === race.id}
            >
              {deleteLoadingId === race.id ? 'Suppression…' : 'Supprimer'}
            </Button>
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

      <AdminDataGrid
        data={filteredRaces}
        columns={columns}
        loading={combinedLoading}
        emptyMessage={
          searchTerm || typeFilter !== 'all'
            ? 'Aucun format ne correspond aux filtres appliqués.'
            : 'Aucun format enregistré. Créez une course pour structurer vos billets.'
        }
        toolbar={
          <div className="grid gap-3 md:grid-cols-3">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Rechercher par nom, public ou description…"
                  className="pl-9"
                />
              </div>
            </div>
            <Select
              value={typeFilter}
              onValueChange={(value) => setTypeFilter(value as typeof typeFilter)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="trail">Trail</SelectItem>
                <SelectItem value="obstacle">Obstacle</SelectItem>
                <SelectItem value="urbain">Urbain</SelectItem>
                <SelectItem value="nature">Nature</SelectItem>
                <SelectItem value="extreme">Extrême</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
        meta={
          <span>
            {filteredRaces.length} format{filteredRaces.length > 1 ? 's' : ''} affiché
          </span>
        }
        getRowId={(race) => race.id}
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
    </div>
  )
}

