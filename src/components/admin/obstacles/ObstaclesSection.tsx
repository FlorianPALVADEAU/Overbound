'use client'

import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { parseOperationsListUrlState, writeOperationsListUrlState } from '@/components/admin/operations/operationsListUrlState'
import { OperationsList, type OperationsListAction, type OperationsListColumn } from '@/components/admin/operations'
import type { Obstacle } from '@/types/Obstacle'
import { ObstacleFormDialog, type ObstacleFormValues } from './ObstacleFormDialog'
import { ObstaclePreviewDialog } from './ObstaclePreviewDialog'
import {
  adminObstaclesQueryKey,
  createAdminObstacle,
  deleteAdminObstacle,
  updateAdminObstacle,
  useAdminObstaclesPage,
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
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const initialUrl = useMemo(() => parseOperationsListUrlState(searchParams, { filterIds: ['type', 'difficulty'] }), [searchParams])
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const deferredSearch = useDeferredValue(searchTerm.trim())
  const [typeFilter, setTypeFilter] = useState<'all' | Obstacle['type']>((initialUrl.filters.type as Obstacle['type'] | undefined) ?? 'all')
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | '1-3' | '4-6' | '7-10'>((initialUrl.filters.difficulty as 'all' | '1-3' | '4-6' | '7-10' | undefined) ?? 'all')
  const [limit, setLimit] = useState(initialUrl.limit)
  const [cursor, setCursor] = useState<string | null>(initialUrl.cursor)
  const [previousCursors, setPreviousCursors] = useState<string[]>([])
  const obstacleParams = useMemo(() => ({ cursor, limit, query: deferredSearch || undefined, type: typeFilter === 'all' ? undefined : typeFilter, difficulty: difficultyFilter, sort: 'created_at' as const, direction: 'desc' as const }), [cursor, deferredSearch, difficultyFilter, limit, typeFilter])
  const { data: pageData, isLoading, isFetching, error: obstaclesError } = useAdminObstaclesPage(obstacleParams)
  const obstacles = pageData?.obstacles ?? []
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create')
  const [selectedObstacle, setSelectedObstacle] = useState<Obstacle | null>(null)
  const [previewObstacle, setPreviewObstacle] = useState<Obstacle | null>(null)
  const [formValues, setFormValues] = useState<ObstacleFormValues>(buildFormValues())
  const [submitting, setSubmitting] = useState(false)
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null)
  const [message, setMessage] = useState<MessageState | null>(null)
  const filteredObstacles = obstacles
  const resetPagination = () => { setCursor(null); setPreviousCursors([]) }
  useEffect(() => { resetPagination() }, [deferredSearch])
  useEffect(() => {
    const next = writeOperationsListUrlState(searchParams, { cursor, sort: null, direction: null, limit, selectedId: null, filters: { type: typeFilter === 'all' ? '' : typeFilter, difficulty: difficultyFilter === 'all' ? '' : difficultyFilter } }, { filterIds: ['type', 'difficulty'] })
    if (next !== searchParams.toString()) router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false })
  }, [cursor, difficultyFilter, limit, pathname, router, searchParams, typeFilter])

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
      await queryClient.invalidateQueries({ queryKey: adminObstaclesQueryKey })
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

      await queryClient.invalidateQueries({ queryKey: adminObstaclesQueryKey })

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

  const columns = useMemo<OperationsListColumn<Obstacle>[]>(() => {
    return [
      {
        id: 'name',
        header: 'Obstacle',
        className: 'max-w-[300px]',
        cell: (obstacle) => (
          <div className="flex flex-col gap-1 max-w-[300px]">
            <span className="font-semibold truncate" title={obstacle.name}>{obstacle.name}</span>
            {obstacle.description ? (
              <span className="text-xs text-muted-foreground line-clamp-1" title={obstacle.description}>
                {obstacle.description}
              </span>
            ) : null}
          </div>
        ),
      },
      {
        id: 'type',
        header: 'Type',
        className: 'w-[120px]',
        cell: (obstacle) => (
          <Badge variant="secondary" className="capitalize">
            {obstacle.type}
          </Badge>
        ),
      },
      {
        id: 'difficulty',
        header: 'Difficulté',
        className: 'w-[100px]',
        cell: (obstacle) => <span>{obstacle.difficulty}/10</span>,
      },
      {
        id: 'media',
        header: 'Médias',
        className: 'w-[180px]',
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
        id: 'updated',
        header: 'Mise à jour',
        className: 'w-[140px]',
        cell: (obstacle) => (
          <span className="text-sm text-muted-foreground">{formatDateTime(obstacle.updated_at)}</span>
        ),
      },
    ]
  }, [])

  const rowActions = useMemo<OperationsListAction<Obstacle>[]>(() => [
    { id: 'preview', label: 'Voir', onSelect: handlePreview },
    { id: 'edit', label: 'Modifier', onSelect: handleEdit },
    { id: 'delete', label: 'Supprimer', destructive: true, disabled: (obstacle) => deleteLoadingId === obstacle.id, onSelect: handleDelete },
  ], [deleteLoadingId])

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

      <OperationsList
        data={{ items: filteredObstacles, nextCursor: pageData?.page.nextCursor ?? null, total: pageData?.page.totalCount }}
        status={obstaclesError ? 'error' : isLoading && !pageData ? 'loading' : isFetching ? 'stale' : 'idle'}
        errorMessage={obstaclesError?.message}
        onRetry={() => window.location.reload()}
        getItemId={(obstacle) => obstacle.id}
        columns={columns}
        filters={[
          { id: 'type', label: 'Type', value: typeFilter === 'all' ? '' : typeFilter, options: ['force', 'agilité', 'technique', 'endurance', 'mental', 'équilibre', 'vitesse'].map((value) => ({ value, label: value })) },
          { id: 'difficulty', label: 'Difficulté', value: difficultyFilter === 'all' ? '' : difficultyFilter, options: [{ value: '1-3', label: 'Facile (1-3)' }, { value: '4-6', label: 'Intermédiaire (4-6)' }, { value: '7-10', label: 'Difficile (7-10)' }] },
          { id: 'limit', label: 'Lignes', value: String(limit), options: [25, 50, 100].map((value) => ({ value: String(value), label: String(value) })) },
        ]}
        onFilterChange={(id, value) => { resetPagination(); if (id === 'type') setTypeFilter((value || 'all') as typeof typeFilter); if (id === 'difficulty') setDifficultyFilter((value || 'all') as typeof difficultyFilter); if (id === 'limit') setLimit(Number(value)) }}
        search={searchTerm}
        searchPlaceholder="Rechercher par nom ou description…"
        onSearchChange={setSearchTerm}
        rowActions={rowActions}
        pagination={{ cursor, previousCursors, nextCursor: pageData?.page.nextCursor ?? null, total: pageData?.page.totalCount, limit }}
        onPaginationChange={({ cursor: nextCursor, previousCursors: nextPreviousCursors }) => { setCursor(nextCursor); setPreviousCursors(nextPreviousCursors) }}
        itemLabel="obstacle"
        emptyState={<div className="px-3 py-12 text-center text-sm text-muted-foreground">{searchTerm || typeFilter !== 'all' || difficultyFilter !== 'all' ? 'Aucun obstacle ne correspond aux filtres appliqués.' : 'Aucun obstacle enregistré.'}</div>}
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
