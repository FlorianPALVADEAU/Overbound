'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Plus } from 'lucide-react'
import type { Upsell } from '@/types/Upsell'
import { UpsellFormDialog, UpsellFormValues } from './UpsellFormDialog'
import { UpsellsEmptyState } from './UpsellsEmptyState'
import { UpsellList } from './UpsellList'
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
  }
}

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

  const hasUpsells = upsells.length > 0

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

  const alertVariant = message?.type === 'error' ? 'destructive' : 'default'

  const renderContent = () => {
    if (isLoading) {
      return (
        <Card className="p-8 text-center text-muted-foreground">
          Chargement des upsells...
        </Card>
      )
    }

    if (upsellsError) {
      return (
        <Card className="p-8 text-center text-destructive">
          {(upsellsError as Error).message || 'Erreur lors du chargement des upsells'}
        </Card>
      )
    }

    if (!hasUpsells) {
      return <UpsellsEmptyState onCreate={handleCreateClick} />
    }

    return (
      <UpsellList
        upsells={upsells}
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
          <h2 className="text-2xl font-bold">Upsells</h2>
          <p className="text-muted-foreground">Gérez les produits complémentaires pour vos événements.</p>
        </div>
        <Button onClick={handleCreateClick}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvel upsell
        </Button>
      </div>

      {message && (
        <Alert variant={alertVariant}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {renderContent()}

      <UpsellFormDialog
        open={dialogOpen}
        mode={dialogMode}
        events={events}
        initialValues={formValues}
        loading={submitting}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
