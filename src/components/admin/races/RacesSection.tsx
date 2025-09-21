'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Plus } from 'lucide-react'
import type { Race } from '@/types/Race'
import type { Obstacle } from '@/types/Obstacle'
import { RaceFormDialog, RaceFormValues } from './RaceFormDialog'
import { RacesEmptyState } from './RacesEmptyState'
import { RaceList } from './RaceList'
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

  const hasRaces = races.length > 0

  const combinedLoading = racesLoading || obstaclesLoading
  const combinedError = racesError || obstaclesError

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

  const alertVariant = message?.type === 'error' ? 'destructive' : 'default'

  const renderContent = () => {
    if (combinedLoading) {
      return (
        <Card className="p-8 text-center text-muted-foreground">
          Chargement des courses...
        </Card>
      )
    }

    if (combinedError) {
      return (
        <Card className="p-8 text-center text-destructive">
          {(combinedError as Error).message || 'Erreur lors du chargement des courses'}
        </Card>
      )
    }

    if (!hasRaces) {
      return <RacesEmptyState onCreate={handleCreateClick} />
    }

    return (
      <RaceList
        races={races}
        onEdit={handleEdit}
        onDelete={handleDelete}
        deleteLoadingId={deleteLoadingId}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestion des courses</h2>
          <p className="text-muted-foreground">
            Créer et gérer les différents types de courses et leurs obstacles.
          </p>
        </div>
        <Button onClick={handleCreateClick}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle course
        </Button>
      </div>

      {message && (
        <Alert variant={alertVariant}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {renderContent()}

      <RaceFormDialog
        open={dialogOpen}
        mode={dialogMode}
        obstacles={obstacles}
        initialValues={formValues}
        loading={submitting}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
