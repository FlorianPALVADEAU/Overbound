'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Plus } from 'lucide-react'
import type { PromotionalCode } from '@/types/PromotionalCode'
import { PromotionalCodeFormDialog, PromotionalCodeFormValues } from './PromotionalCodeFormDialog'
import { PromotionalCodesEmptyState } from './PromotionalCodesEmptyState'
import { PromotionalCodeList } from './PromotionalCodeList'
import {
  adminPromotionalCodesQueryKey,
  createAdminPromotionalCode,
  deleteAdminPromotionalCode,
  updateAdminPromotionalCode,
  useAdminPromotionalCodes,
  type AdminPromotionalCodePayload,
} from '@/app/api/admin/promotional-codes/promotionalCodesQueries'
import { useAdminEvents } from '@/app/api/admin/events/eventsQueries'

interface MessageState {
  type: 'success' | 'error'
  text: string
}

function buildFormValues(code?: PromotionalCode): PromotionalCodeFormValues {
  if (!code) {
    return {
      code: '',
      name: '',
      description: '',
      discountType: 'percent',
      discountValue: '10',
      currency: 'eur',
      valid_from: '',
      valid_until: '',
      usage_limit: '',
      is_active: true,
      event_ids: [],
    }
  }

  const discountType = code.discount_percent ? 'percent' : 'amount'
  const discountValue = code.discount_percent
    ? code.discount_percent.toString()
    : code.discount_amount
    ? code.discount_amount.toString()
    : '0'

  return {
    code: code.code,
    name: code.name,
    description: code.description || '',
    discountType,
    discountValue,
    currency: code.currency,
    valid_from: new Date(code.valid_from).toISOString().slice(0, 16),
    valid_until: new Date(code.valid_until).toISOString().slice(0, 16),
    usage_limit: code.usage_limit?.toString() || '',
    is_active: code.is_active,
    event_ids: (code.events || []).map((event) => event.event_id),
  }
}

export function PromotionalCodesSection() {
  const queryClient = useQueryClient()
  const {
    data: promotionalCodes = [],
    isLoading,
    error: promotionalCodesError,
  } = useAdminPromotionalCodes()
  const { data: events = [] } = useAdminEvents()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create')
  const [selectedCode, setSelectedCode] = useState<PromotionalCode | null>(null)
  const [formValues, setFormValues] = useState<PromotionalCodeFormValues>(buildFormValues())
  const [submitting, setSubmitting] = useState(false)
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null)
  const [message, setMessage] = useState<MessageState | null>(null)

  const hasCodes = promotionalCodes.length > 0

  const handleCreateClick = () => {
    setDialogMode('create')
    setSelectedCode(null)
    setFormValues(buildFormValues())
    setDialogOpen(true)
  }

  const handleEdit = (code: PromotionalCode) => {
    setDialogMode('edit')
    setSelectedCode(code)
    setFormValues(buildFormValues(code))
    setDialogOpen(true)
  }

  const handleDelete = async (code: PromotionalCode) => {
    if (!confirm(`Supprimer le code "${code.code}" ?`)) {
      return
    }

    setDeleteLoadingId(code.id)
    try {
      await deleteAdminPromotionalCode(code.id)
      queryClient.setQueryData<PromotionalCode[]>(adminPromotionalCodesQueryKey, (previous) => {
        if (!previous) return []
        return previous.filter((item) => item.id !== code.id)
      })
      setMessage({ type: 'success', text: 'Code supprimé avec succès' })
    } catch (error) {
      const text = axios.isAxiosError(error)
        ? error.response?.data?.error || error.message
        : (error as Error).message || 'Erreur lors de la suppression'
      setMessage({ type: 'error', text })
    } finally {
      setDeleteLoadingId(null)
    }
  }

  const handleSubmit = async (values: PromotionalCodeFormValues) => {
    if (!values.code || !values.name || !values.valid_from || !values.valid_until) {
      setMessage({ type: 'error', text: 'Veuillez remplir les champs obligatoires' })
      return
    }

    if (!values.discountValue) {
      setMessage({ type: 'error', text: 'La valeur de la remise est obligatoire' })
      return
    }

    const discountValue = parseInt(values.discountValue, 10)
    if (Number.isNaN(discountValue) || discountValue <= 0) {
      setMessage({ type: 'error', text: 'La valeur de la remise doit être un nombre positif.' })
      return
    }

    if (values.discountType === 'percent' && discountValue > 100) {
      setMessage({ type: 'error', text: 'Le pourcentage de réduction doit être inférieur ou égal à 100.' })
      return
    }

    const trimmedUsageLimit = values.usage_limit.trim()
    const parsedUsageLimit = trimmedUsageLimit ? parseInt(trimmedUsageLimit, 10) : null

    if (trimmedUsageLimit && Number.isNaN(parsedUsageLimit)) {
      setMessage({ type: 'error', text: 'La limite d\'utilisation doit être un nombre positif.' })
      return
    }

    if (parsedUsageLimit !== null && parsedUsageLimit < 1) {
      setMessage({ type: 'error', text: 'La limite d\'utilisation doit être supérieure à 0 ou laissée vide.' })
      return
    }

    setSubmitting(true)
    setMessage(null)

    const payload: AdminPromotionalCodePayload = {
      code: values.code.toUpperCase(),
      name: values.name,
      description: values.description || null,
      discount_percent: values.discountType === 'percent' ? discountValue : null,
      discount_amount: values.discountType === 'amount' ? discountValue : null,
      currency: values.currency || 'eur',
      valid_from: new Date(values.valid_from).toISOString(),
      valid_until: new Date(values.valid_until).toISOString(),
      usage_limit: parsedUsageLimit,
      is_active: values.is_active,
      event_ids: values.event_ids,
    }

    try {
      if (dialogMode === 'create') {
        const created = await createAdminPromotionalCode(payload)
        queryClient.setQueryData<PromotionalCode[]>(adminPromotionalCodesQueryKey, (previous) => {
          if (!previous) return [created]
          return [created, ...previous]
        })
        setMessage({ type: 'success', text: 'Code promotionnel créé avec succès' })
      } else if (selectedCode) {
        const updated = await updateAdminPromotionalCode(selectedCode.id, payload)
        queryClient.setQueryData<PromotionalCode[]>(adminPromotionalCodesQueryKey, (previous) => {
          if (!previous) return [updated]
          return previous.map((item) => (item.id === selectedCode.id ? updated : item))
        })
        setMessage({ type: 'success', text: 'Code promotionnel mis à jour avec succès' })
      }

      setDialogOpen(false)
      setSelectedCode(null)
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
          Chargement des codes promotionnels...
        </Card>
      )
    }

    if (promotionalCodesError) {
      return (
        <Card className="p-8 text-center text-destructive">
          {(promotionalCodesError as Error).message || 'Erreur lors du chargement des codes promotionnels'}
        </Card>
      )
    }

    if (!hasCodes) {
      return <PromotionalCodesEmptyState onCreate={handleCreateClick} />
    }

    return (
      <PromotionalCodeList
        promotionalCodes={promotionalCodes}
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
          <h2 className="text-2xl font-bold">Codes promotionnels</h2>
          <p className="text-muted-foreground">Gérez les réductions et promotions disponibles.</p>
        </div>
        <Button onClick={handleCreateClick}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau code
        </Button>
      </div>

      {message && (
        <Alert variant={alertVariant}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {renderContent()}

      <PromotionalCodeFormDialog
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
