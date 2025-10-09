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
import type { Obstacle } from '@/types/Obstacle'
import { ObstacleFormDialog, type ObstacleFormValues } from './ObstacleFormDialog'
import { ObstaclePreviewDialog } from './ObstaclePreviewDialog'
import {
  adminObstaclesQueryKey,
  createAdminObstacle,
  deleteAdminObstacle,
  updateAdminObstacle,
  useAdminObstacles,
  type AdminObstaclePayload,
} from '@/app/api/admin/obstacles/obstaclesQueries'

interface MessageState {
  type: 'success' | 'error'
  text: string
}

function buildFormValues(obstacle?: Obstacle): ObstacleFormValues {
  if (!obstacle) {
    return {
      name: '',
      description: '',
      image_url: '',
      video_url: '',
      difficulty: '5',
      type: 'force',
    }
  }

  return {
    name: obstacle.name,
    description: obstacle.description || '',
    image_url: obstacle.image_url || '',
    video_url: obstacle.video_url || '',
    difficulty: obstacle.difficulty.toString(),
    type: obstacle.type,
  }
}

const formatDateTime = (value: string) =>
  new Date(value).toLocaleDateString('fr-FR', { dateStyle: 'medium' })

export function ObstaclesSection() {
  const queryClient = useQueryClient()
  const {
    data: obstacles = [],
    isLoading,
    error: obstaclesError,
  } = useAdminObstacles()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create')
  const [selectedObstacle, setSelectedObstacle] = useState<Obstacle | null>(null)
  const [previewObstacle, setPreviewObstacle] = useState<Obstacle | null>(null)
  const [formValues, setFormValues] = useState<ObstacleFormValues>(buildFormValues())
  const [submitting, setSubmitting] = useState(false)
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null)
  const [message, setMessage] = useState<MessageState | null>(null)
  const [typeFilter, setTypeFilter] = useState<'all' | Obstacle['type']>('all')
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | '1-3' | '4-6' | '7-10'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const filteredObstacles = useMemo(() => {
    let result = [...obstacles]

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      result = result.filter((obstacle) =>
        obstacle.name.toLowerCase().includes(term) ||
        obstacle.description?.toLowerCase().includes(term)
      )
    }

    if (typeFilter !== 'all') {
      result = result.filter((obstacle) => obstacle.type === typeFilter)
    }

    if (difficultyFilter !== 'all') {
      const [min, max] = difficultyFilter.split('-').map(Number)
      result = result.filter((obstacle) => obstacle.difficulty >= min && obstacle.difficulty <= max)
    }

    return result
  }, [obstacles, searchTerm, typeFilter, difficultyFilter])

  const handleCreateClick = () => {
    setDialogMode('create')
    setSelectedObstacle(null)
    setFormValues(buildFormValues())
    setDialogOpen(true)
  }

  const handleEdit = (obstacle: Obstacle) => {
    setDialogMode('edit')
    setSelectedObstacle(obstacle)
    setFormValues(buildFormValues(obstacle))
    setDialogOpen(true)
  }

  const handlePreview = (obstacle: Obstacle) => {
    setPreviewObstacle(obstacle)
  }

  const handleDelete = async (obstacle: Obstacle) => {
    if (!confirm(`Supprimer l'obstacle "${obstacle.name}" ?`)) {
      return
    }

    setDeleteLoadingId(obstacle.id)
    try {
      await deleteAdminObstacle(obstacle.id)
      queryClient.setQueryData<Obstacle[]>(adminObstaclesQueryKey, (previous) => {
        if (!previous) return []
        return previous.filter((item) => item.id !== obstacle.id)
      })
      setMessage({ type: 'success', text: 'Obstacle supprimé avec succès' })
    } catch (error) {
      const text = axios.isAxiosError(error)
        ? error.response?.data?.error || error.message
        : (error as Error).message || 'Erreur lors de la suppression'
      setMessage({ type: 'error', text })
    } finally {
      setDeleteLoadingId(null)
    }
  }

  const handleSubmit = async (values: ObstacleFormValues) => {
    if (!values.name || !values.type) {
      setMessage({ type: 'error', text: 'Le nom et le type sont obligatoires' })
      return
    }

    const difficulty = parseInt(values.difficulty, 10)
    if (Number.isNaN(difficulty) || difficulty < 1 || difficulty > 10) {
      setMessage({ type: 'error', text: 'La difficulté doit être comprise entre 1 et 10' })
      return
    }

    setSubmitting(true)
    setMessage(null)

    const payload: AdminObstaclePayload = {
      name: values.name,
      description: values.description || null,
      image_url: values.image_url || null,
      video_url: values.video_url || null,
      difficulty,
      type: values.type,
    }

    try {
      if (dialogMode === 'create') {
        const created = await createAdminObstacle(payload)
        queryClient.setQueryData<Obstacle[]>(adminObstaclesQueryKey, (previous) => {
          if (!previous) return [created]
          return [created, ...previous]
        })
        setMessage({ type: 'success', text: 'Obstacle créé avec succès' })
      } else if (selectedObstacle) {
        const updated = await updateAdminObstacle(selectedObstacle.id, payload)
        queryClient.setQueryData<Obstacle[]>(adminObstaclesQueryKey, (previous) => {
          if (!previous) return [updated]
          return previous.map((item) => (item.id === selectedObstacle.id ? updated : item))
        })
        setMessage({ type: 'success', text: 'Obstacle mis à jour avec succès' })
      }

      setDialogOpen(false)
      setSelectedObstacle(null)
    } catch (error) {
      const text = axios.isAxiosError(error)
        ? error.response?.data?.error || error.message
        : (error as Error).message || 'Erreur lors de la sauvegarde'
      setMessage({ type: 'error', text })
    } finally {
      setSubmitting(false)
    }
  }

  const columns = useMemo<AdminDataGridColumn<Obstacle>[]>(() => {
    return [
      {
        key: 'name',
        header: 'Obstacle',
        cell: (obstacle) => (
          <div className="flex flex-col gap-1">
            <span className="font-semibold">{obstacle.name}</span>
            {obstacle.description ? (
              <span className="text-xs text-muted-foreground line-clamp-1">
                {obstacle.description}
              </span>
            ) : null}
          </div>
        ),
      },
      {
        key: 'type',
        header: 'Type',
        cell: (obstacle) => (
          <Badge variant="secondary" className="capitalize">
            {obstacle.type}
          </Badge>
        ),
      },
      {
        key: 'difficulty',
        header: 'Difficulté',
        cell: (obstacle) => <span>{obstacle.difficulty}/10</span>,
      },
      {
        key: 'media',
        header: 'Médias',
        cell: (obstacle) => (
          <div className="flex flex-wrap gap-1.5">
            <Badge variant={obstacle.image_url ? 'default' : 'secondary'}>
              Image {obstacle.image_url ? '✓' : '—'}
            </Badge>
            <Badge variant={obstacle.video_url ? 'default' : 'secondary'}>
              Vidéo {obstacle.video_url ? '✓' : '—'}
            </Badge>
          </div>
        ),
      },
      {
        key: 'updated',
        header: 'Mise à jour',
        cell: (obstacle) => (
          <span className="text-sm text-muted-foreground">{formatDateTime(obstacle.updated_at)}</span>
        ),
      },
      {
        key: 'actions',
        header: '',
        className: 'w-[210px]',
        cell: (obstacle) => (
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => handlePreview(obstacle)}>
              Voir
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleEdit(obstacle)}>
              Modifier
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleDelete(obstacle)}
              disabled={deleteLoadingId === obstacle.id}
            >
              {deleteLoadingId === obstacle.id ? 'Suppression…' : 'Supprimer'}
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
          <h2 className="text-2xl font-bold">Catalogue obstacles</h2>
          <p className="text-muted-foreground">
            Centralise et gère les obstacles disponibles pour les courses.
          </p>
        </div>
        <Button onClick={handleCreateClick}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvel obstacle
        </Button>
      </div>

      {message && (
        <Alert variant={alertVariant}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {obstaclesError ? (
        <Alert variant="destructive">
          <AlertDescription>
            {(obstaclesError as Error).message || 'Impossible de charger les obstacles'}
          </AlertDescription>
        </Alert>
      ) : null}

      <AdminDataGrid
        data={filteredObstacles}
        columns={columns}
        loading={isLoading}
        emptyMessage={
          searchTerm || typeFilter !== 'all' || difficultyFilter !== 'all'
            ? 'Aucun obstacle ne correspond aux filtres appliqués.'
            : 'Aucun obstacle enregistré pour le moment.'
        }
        toolbar={
          <div className="grid gap-3 md:grid-cols-3">
            <div className="md:col-span-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Rechercher par nom ou description…"
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as typeof typeFilter)}>
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="force">Force</SelectItem>
                <SelectItem value="agilité">Agilité</SelectItem>
                <SelectItem value="technique">Technique</SelectItem>
                <SelectItem value="endurance">Endurance</SelectItem>
                <SelectItem value="mental">Mental</SelectItem>
                <SelectItem value="équilibre">Équilibre</SelectItem>
                <SelectItem value="vitesse">Vitesse</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={difficultyFilter}
              onValueChange={(value) => setDifficultyFilter(value as typeof difficultyFilter)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Difficulté" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les difficultés</SelectItem>
                <SelectItem value="1-3">Facile (1-3)</SelectItem>
                <SelectItem value="4-6">Intermédiaire (4-6)</SelectItem>
                <SelectItem value="7-10">Difficile (7-10)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
        meta={
          <span>
            {filteredObstacles.length} obstacle{filteredObstacles.length > 1 ? 's' : ''} affiché
          </span>
        }
        getRowId={(obstacle) => obstacle.id}
      />

      <ObstacleFormDialog
        open={dialogOpen}
        mode={dialogMode}
        initialValues={formValues}
        loading={submitting}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
      />

      <ObstaclePreviewDialog
        obstacle={previewObstacle}
        open={Boolean(previewObstacle)}
        onOpenChange={(open) => {
          if (!open) {
            setPreviewObstacle(null)
          }
        }}
      />
    </div>
  )
}

