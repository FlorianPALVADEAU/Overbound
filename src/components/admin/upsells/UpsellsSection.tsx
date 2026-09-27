'use client'

import { useDeferredValue, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import type { Upsell } from '@/types/Upsell'
import { UpsellFormDialog, type UpsellFormValues } from './UpsellFormDialog'
import {
  adminUpsellsQueryKey,
  createAdminUpsell,
  deleteAdminUpsell,
  updateAdminUpsell,
  useAdminUpsellsPage,
  type AdminUpsellPayload,
} from '@/app/api/admin/upsells/upsellsQueries'
import { OperationsList, type OperationsListAction, type OperationsListColumn, type OperationsListFilter } from '@/components/admin/operations'
import { useAdminEvents } from '@/app/api/admin/events/eventsQueries'
import { createSupabaseBrowser } from '@/lib/supabase/client'

interface MessageState {
  type: 'success' | 'error'
  text: string
}

function buildFormValues(upsell?: Upsell): UpsellFormValues {
  if (!upsell) {
    return {
      name: '',
      description: '',
      price_cents: '0',
      currency: 'eur',
      type: 'other',
      event_id: 'none',
      is_active: true,
      stock_quantity: '',
      image_url: '',
      images: [],
      sizes: '',
    }
  }

  return {
    name: upsell.name,
    description: upsell.description || '',
    price_cents: upsell.price_cents.toString(),
    currency: upsell.currency,
    type: upsell.type,
    event_id: upsell.event_id || 'none',
    is_active: upsell.is_active,
    stock_quantity: upsell.stock_quantity?.toString() || '',
    image_url: upsell.image_url || '',
    images: (upsell.images ?? [])
      .filter((image) => Boolean(image.external_url) || (image.source === 'upload' && Boolean(image.storage_path)))
      .sort((left, right) => left.position - right.position)
      .map((image) => ({
        id: image.id,
        url: image.external_url ?? (image.storage_path
          ? createSupabaseBrowser().storage.from('upsell-images').getPublicUrl(image.storage_path).data.publicUrl
          : ''),
        alt_text: image.alt_text ?? '',
        source: image.source,
        storage_path: image.storage_path ?? undefined,
      })),
    sizes:
      upsell.type === 'tshirt' && upsell.options?.sizes && upsell.options.sizes.length > 0
        ? upsell.options.sizes.join(', ')
        : '',
  }
}

const formatPrice = (cents: number, currency: string) =>
  (cents / 100).toLocaleString('fr-FR', {
    style: 'currency',
    currency: currency.toUpperCase(),
  })

export function UpsellsSection() {
  const queryClient = useQueryClient()
  const [cursor, setCursor] = useState<string | null>(null)
  const [previousCursors, setPreviousCursors] = useState<string[]>([])
  const [limit, setLimit] = useState<25 | 50 | 100>(50)
  const [sort, setSort] = useState<'created_at' | 'name' | 'price_cents'>('created_at')
  const [direction, setDirection] = useState<'asc' | 'desc'>('desc')
  const { data: events = [] } = useAdminEvents()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create')
  const [selectedUpsell, setSelectedUpsell] = useState<Upsell | null>(null)
  const [formValues, setFormValues] = useState<UpsellFormValues>(buildFormValues())
  const [submitting, setSubmitting] = useState(false)
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null)
  const [message, setMessage] = useState<MessageState | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const deferredSearch = useDeferredValue(searchTerm.trim())
  const { data: page, isLoading, isFetching, error: upsellsError } = useAdminUpsellsPage({ cursor, limit, query: deferredSearch, status: statusFilter, sort, direction })
  const upsells = page?.upsells ?? []
  const filteredUpsells = upsells

  const resetPagination = () => { setCursor(null); setPreviousCursors([]) }

  const handleCreateClick = () => {
    setDialogMode('create')
    setSelectedUpsell(null)
    setFormValues(buildFormValues())
    setDialogOpen(true)
  }

  const handleEdit = (upsell: Upsell) => {
    setDialogMode('edit')
    setSelectedUpsell(upsell)
    setFormValues(buildFormValues(upsell))
    setDialogOpen(true)
  }

  const handleDelete = async (upsell: Upsell) => {
    if (!confirm(`Supprimer l'upsell "${upsell.name}" ?`)) {
      return
    }

    setDeleteLoadingId(upsell.id)
    try {
      await deleteAdminUpsell(upsell.id)
      queryClient.setQueryData<Upsell[]>(adminUpsellsQueryKey, (previous) => {
        if (!previous) return []
        return previous.filter((item) => item.id !== upsell.id)
      })
      setMessage({ type: 'success', text: 'Upsell supprimé avec succès' })
    } catch (error) {
      const text = axios.isAxiosError(error)
        ? error.response?.data?.error || error.message
        : (error as Error).message || 'Erreur lors de la suppression'
      setMessage({ type: 'error', text })
    } finally {
      setDeleteLoadingId(null)
    }
  }

  const handleSubmit = async (values: UpsellFormValues) => {
    if (!values.name || !values.price_cents) {
      setMessage({ type: 'error', text: 'Le nom et le prix sont obligatoires' })
      return
    }

    setSubmitting(true)
    setMessage(null)

    const payload: AdminUpsellPayload = {
      name: values.name,
      description: values.description || null,
      price_cents: parseInt(values.price_cents, 10) || 0,
      currency: values.currency || 'eur',
      type: values.type,
      event_id: values.event_id === 'none' ? null : values.event_id,
      is_active: values.is_active,
      stock_quantity: values.stock_quantity ? parseInt(values.stock_quantity, 10) : null,
      // Keep image_url populated during the transition: existing consumers can
      // continue using it while gallery-aware ones read images.
      image_url: values.images.find((image) => image.url.trim())?.url.trim() || values.image_url || null,
      images: values.images
        .filter((image) => image.url.trim())
        .map((image, position) => ({
          source: 'external' as const,
          external_url: image.url.trim(),
          alt_text: image.alt_text.trim() || null,
          position,
        })),
      options:
        values.type === 'tshirt'
          ? {
              sizes: values.sizes
                .split(/[\n,]/)
                .map((size) => size.trim())
                .filter((size) => size.length > 0),
            }
          : null,
    }

    if (payload.options && payload.options.sizes && payload.options.sizes.length === 0) {
      payload.options = null
    }

    try {
      if (dialogMode === 'create') {
        const created = await createAdminUpsell(payload)
        const pendingUploads = values.images.filter((image) => image.source === 'upload' && image.file)
        for (const image of pendingUploads) {
          const form = new FormData()
          form.set('file', image.file as File)
          await axios.post(`/api/admin/upsells/${created.id}/images`, form)
        }
        if (pendingUploads.length > 0) {
          await queryClient.invalidateQueries({ queryKey: adminUpsellsQueryKey })
        }
        queryClient.setQueryData<Upsell[]>(adminUpsellsQueryKey, (previous) => {
          if (!previous) return [created]
          return [created, ...previous]
        })
        setMessage({ type: 'success', text: 'Upsell créé avec succès' })
      } else if (selectedUpsell) {
        const updated = await updateAdminUpsell(selectedUpsell.id, payload)
        queryClient.setQueryData<Upsell[]>(adminUpsellsQueryKey, (previous) => {
          if (!previous) return [updated]
          return previous.map((item) => (item.id === selectedUpsell.id ? updated : item))
        })
        setMessage({ type: 'success', text: 'Upsell mis à jour avec succès' })
      }

      setDialogOpen(false)
      setSelectedUpsell(null)
    } catch (error) {
      const text = axios.isAxiosError(error)
        ? error.response?.data?.error || error.message
        : (error as Error).message || 'Erreur lors de la sauvegarde'
      setMessage({ type: 'error', text })
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpload = async (file: File) => {
    if (!selectedUpsell) {
      return {
        file,
        url: URL.createObjectURL(file),
        alt_text: '',
        source: 'upload' as const,
      }
    }
    const form = new FormData()
    form.set('file', file)
    const response = await axios.post(`/api/admin/upsells/${selectedUpsell.id}/images`, form)
    await queryClient.invalidateQueries({ queryKey: adminUpsellsQueryKey })
    setMessage({ type: 'success', text: 'Image téléversée avec succès' })
    const image = response.data?.image
    if (!image?.storage_path) return undefined
    return {
      url: createSupabaseBrowser().storage.from('upsell-images').getPublicUrl(image.storage_path).data.publicUrl,
      alt_text: image.alt_text ?? '',
      source: 'upload' as const,
      id: image.id,
      storage_path: image.storage_path,
    }
  }

  const handleDeleteUpload = async (image: { id?: string }) => {
    if (!selectedUpsell || !image.id) return
    await axios.delete(`/api/admin/upsells/${selectedUpsell.id}/images`, { params: { image_id: image.id } })
    await queryClient.invalidateQueries({ queryKey: adminUpsellsQueryKey })
    setMessage({ type: 'success', text: 'Image supprimée' })
  }

  const columns: OperationsListColumn<Upsell>[] = useMemo(() => {
    return [
      {
        id: 'upsell',
        header: 'Upsell',
        cell: (upsell) => (
          <div className="flex flex-col gap-1">
            <span className="font-semibold">{upsell.name}</span>
            {upsell.description ? (
              <span className="text-xs text-muted-foreground line-clamp-1">
                {upsell.description}
              </span>
            ) : null}
          </div>
        ),
      },
      {
        id: 'price',
        header: 'Tarif',
        cell: (upsell) => (
          <span className="font-medium text-primary">
            {formatPrice(upsell.price_cents, upsell.currency)}
          </span>
        ),
      },
      {
        id: 'type',
        header: 'Type',
        cell: (upsell) => (
          <Badge variant="secondary" className="capitalize">
            {upsell.type}
          </Badge>
        ),
      },
      {
        id: 'event',
        header: 'Événement',
        cell: (upsell) => (
          <div className="flex flex-col text-xs">
            <span>{upsell.event?.title ?? 'Global'}</span>
            {upsell.event?.date ? (
              <span className="text-muted-foreground">
                {new Date(upsell.event.date).toLocaleDateString('fr-FR')}
              </span>
            ) : null}
          </div>
        ),
      },
      {
        id: 'stock',
        header: 'Stock',
        cell: (upsell) => (
          <span>
            {upsell.stock_quantity != null ? upsell.stock_quantity : 'Illimité'}
          </span>
        ),
      },
      {
        id: 'status',
        header: 'Statut',
        cell: (upsell) => (
          <Badge variant={upsell.is_active ? 'default' : 'secondary'}>
            {upsell.is_active ? 'Actif' : 'Inactif'}
          </Badge>
        ),
      },
      {
        id: 'actions',
        header: '',
        className: 'w-[160px]',
        cell: () => null,
      },
    ]
  }, [])

  const alertVariant = message?.type === 'error' ? 'destructive' : 'default'

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Upsells & options</h2>
          <p className="text-muted-foreground">
            Propose des options additionnelles pour enrichir l’expérience participant.
          </p>
        </div>
        <Button onClick={handleCreateClick}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvel upsell
        </Button>
      </div>

      {message && (
        <Alert variant={alertVariant}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {upsellsError ? (
        <Alert variant="destructive">
          <AlertDescription>
            {(upsellsError as Error).message || 'Impossible de charger les upsells'}
          </AlertDescription>
        </Alert>
      ) : null}

      <OperationsList
        data={{ items: upsells, nextCursor: page?.page.nextCursor ?? null, total: page?.page.totalCount }}
        status={upsellsError ? 'error' : isLoading && !page ? 'loading' : isFetching ? 'stale' : 'idle'}
        errorMessage={upsellsError?.message}
        onRetry={() => window.location.reload()}
        getItemId={(upsell) => upsell.id}
        columns={columns.filter((column) => column.id !== 'actions')}
        filters={[
          { id: 'status', label: 'Statut', value: statusFilter, allLabel: 'Tous les statuts', options: [{ value: 'active', label: 'Actifs' }, { value: 'inactive', label: 'Inactifs' }] },
          { id: 'sort', label: 'Trier par', value: sort, options: [{ value: 'created_at', label: 'Date de création' }, { value: 'name', label: 'Nom' }, { value: 'price_cents', label: 'Tarif' }] },
          { id: 'direction', label: 'Ordre', value: direction, options: [{ value: 'desc', label: 'Décroissant' }, { value: 'asc', label: 'Croissant' }] },
          { id: 'limit', label: 'Lignes', value: String(limit), options: [25, 50, 100].map((value) => ({ value: String(value), label: String(value) })) },
        ] satisfies OperationsListFilter[]}
        onFilterChange={(id, value) => { resetPagination(); if (id === 'status') setStatusFilter(value as typeof statusFilter); if (id === 'sort') setSort(value as typeof sort); if (id === 'direction') setDirection(value as typeof direction); if (id === 'limit') setLimit(Number(value) as typeof limit) }}
        search={searchTerm}
        searchPlaceholder="Rechercher par nom ou description…"
        onSearchChange={(value) => { setSearchTerm(value); resetPagination() }}
        rowActions={[
          { id: 'edit', label: 'Modifier', onSelect: handleEdit },
          { id: 'delete', label: 'Supprimer', destructive: true, onSelect: handleDelete, disabled: (upsell) => deleteLoadingId === upsell.id },
        ] satisfies OperationsListAction<Upsell>[]}
        pagination={{ cursor, previousCursors, nextCursor: page?.page.nextCursor ?? null, total: page?.page.totalCount, limit }}
        onPaginationChange={({ cursor: nextCursor, previousCursors: nextPreviousCursors }) => { setCursor(nextCursor); setPreviousCursors(nextPreviousCursors) }}
        itemLabel="upsell"
      />

      <UpsellFormDialog
        open={dialogOpen}
        mode={dialogMode}
        initialValues={formValues}
        loading={submitting}
        events={events}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        onUpload={handleUpload}
        onDeleteUpload={dialogMode === 'edit' ? handleDeleteUpload : undefined}
      />
    </div>
  )
}
