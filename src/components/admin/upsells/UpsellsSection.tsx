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
import type { Upsell } from '@/types/Upsell'
import { UpsellFormDialog, type UpsellFormValues } from './UpsellFormDialog'
import {
  adminUpsellsQueryKey,
  createAdminUpsell,
  deleteAdminUpsell,
  updateAdminUpsell,
  useAdminUpsells,
  type AdminUpsellPayload,
} from '@/app/api/admin/upsells/upsellsQueries'
import { useAdminEvents } from '@/app/api/admin/events/eventsQueries'

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
  const {
    data: upsells = [],
    isLoading,
    error: upsellsError,
  } = useAdminUpsells()
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

  const filteredUpsells = useMemo(() => {
    let result = [...upsells]

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      result = result.filter((upsell) => {
        return (
          upsell.name.toLowerCase().includes(term) ||
          upsell.description?.toLowerCase().includes(term)
        )
      })
    }

    if (statusFilter !== 'all') {
      result = result.filter((upsell) =>
        statusFilter === 'active' ? upsell.is_active : !upsell.is_active
      )
    }

    return result
  }, [upsells, searchTerm, statusFilter])

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
      image_url: values.image_url || null,
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

  const columns = useMemo<AdminDataGridColumn<Upsell>[]>(() => {
    return [
      {
        key: 'upsell',
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
        key: 'price',
        header: 'Tarif',
        cell: (upsell) => (
          <span className="font-medium text-primary">
            {formatPrice(upsell.price_cents, upsell.currency)}
          </span>
        ),
      },
      {
        key: 'type',
        header: 'Type',
        cell: (upsell) => (
          <Badge variant="secondary" className="capitalize">
            {upsell.type}
          </Badge>
        ),
      },
      {
        key: 'event',
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
        key: 'stock',
        header: 'Stock',
        cell: (upsell) => (
          <span>
            {upsell.stock_quantity != null ? upsell.stock_quantity : 'Illimité'}
          </span>
        ),
      },
      {
        key: 'status',
        header: 'Statut',
        cell: (upsell) => (
          <Badge variant={upsell.is_active ? 'default' : 'secondary'}>
            {upsell.is_active ? 'Actif' : 'Inactif'}
          </Badge>
        ),
      },
      {
        key: 'actions',
        header: '',
        className: 'w-[160px]',
        cell: (upsell) => (
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => handleEdit(upsell)}>
              Modifier
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleDelete(upsell)}
              disabled={deleteLoadingId === upsell.id}
            >
              {deleteLoadingId === upsell.id ? 'Suppression…' : 'Supprimer'}
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

      <AdminDataGrid
        data={filteredUpsells}
        columns={columns}
        loading={isLoading}
        emptyMessage={
          searchTerm || statusFilter !== 'all'
            ? 'Aucun upsell ne correspond aux filtres appliqués.'
            : 'Aucun upsell enregistré pour le moment.'
        }
        toolbar={
          <div className="grid gap-3 md:grid-cols-3">
            <div className="md:col-span-2">
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
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="active">Actifs</SelectItem>
                <SelectItem value="inactive">Inactifs</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
        meta={
          <span>
            {filteredUpsells.length} upsell{filteredUpsells.length > 1 ? 's' : ''} affiché
          </span>
        }
        getRowId={(upsell) => upsell.id}
      />

      <UpsellFormDialog
        open={dialogOpen}
        mode={dialogMode}
        initialValues={formValues}
        loading={submitting}
        events={events}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
