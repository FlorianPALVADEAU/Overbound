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
import type { PromotionalCode } from '@/types/PromotionalCode'
import { PromotionalCodeFormDialog, type PromotionalCodeFormValues } from './PromotionalCodeFormDialog'
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

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

const discountLabel = (code: PromotionalCode) => {
  if (code.discount_percent) {
    return `-${code.discount_percent}%`
  }
  if (code.discount_amount) {
    return `-${(code.discount_amount / 100).toLocaleString('fr-FR', {
      style: 'currency',
      currency: code.currency.toUpperCase(),
    })}`
  }
  return '—'
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
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

  const filteredCodes = useMemo(() => {
    let result = [...promotionalCodes]

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      result = result.filter((code) => {
        return (
          code.code.toLowerCase().includes(term) ||
          code.name.toLowerCase().includes(term) ||
          code.description?.toLowerCase().includes(term)
        )
      })
    }

    if (statusFilter !== 'all') {
      result = result.filter((code) =>
        statusFilter === 'active' ? code.is_active : !code.is_active
      )
    }

    return result
  }, [promotionalCodes, searchTerm, statusFilter])

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

  const columns = useMemo<AdminDataGridColumn<PromotionalCode>[]>(() => {
    return [
      {
        key: 'code',
        header: 'Code',
        cell: (code) => (
          <div className="flex flex-col gap-1">
            <span className="font-semibold uppercase">{code.code}</span>
            <span className="text-xs text-muted-foreground">{code.name}</span>
          </div>
        ),
      },
      {
        key: 'discount',
        header: 'Remise',
        cell: (code) => (
          <span className="font-medium text-primary">{discountLabel(code)}</span>
        ),
      },
      {
        key: 'validity',
        header: 'Validité',
        cell: (code) => (
          <div className="flex flex-col text-xs text-muted-foreground">
            <span>Du {formatDate(code.valid_from)}</span>
            <span>Au {formatDate(code.valid_until)}</span>
          </div>
        ),
      },
      {
        key: 'usage',
        header: 'Utilisation',
        cell: (code) => (
          <span>
            {code.used_count} / {code.usage_limit ?? '∞'} utilisés
          </span>
        ),
      },
      {
        key: 'status',
        header: 'Statut',
        cell: (code) => (
          <Badge variant={code.is_active ? 'default' : 'secondary'}>
            {code.is_active ? 'Actif' : 'Inactif'}
          </Badge>
        ),
      },
      {
        key: 'actions',
        header: '',
        className: 'w-[160px]',
        cell: (code) => (
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => handleEdit(code)}>
              Modifier
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleDelete(code)}
              disabled={deleteLoadingId === code.id}
            >
              {deleteLoadingId === code.id ? 'Suppression…' : 'Supprimer'}
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
          <h2 className="text-2xl font-bold">Codes promotionnels</h2>
          <p className="text-muted-foreground">
            Crée des codes de réduction et attribue-les à tes événements.
          </p>
        </div>
        <Button onClick={handleCreateClick}>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau code
        </Button>
      </div>

      {message && (
        <Alert variant={alertVariant}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {promotionalCodesError ? (
        <Alert variant="destructive">
          <AlertDescription>
            {(promotionalCodesError as Error).message || 'Impossible de charger les codes promotionnels'}
          </AlertDescription>
        </Alert>
      ) : null}

      <AdminDataGrid
        data={filteredCodes}
        columns={columns}
        loading={isLoading}
        emptyMessage={
          searchTerm || statusFilter !== 'all'
            ? 'Aucun code ne correspond aux filtres appliqués.'
            : 'Aucun code promotionnel enregistré.'
        }
        toolbar={
          <div className="grid gap-3 md:grid-cols-3">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Rechercher par code, nom ou description…"
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
            {filteredCodes.length} code{filteredCodes.length > 1 ? 's' : ''} affiché
          </span>
        }
        getRowId={(code) => code.id}
      />

      <PromotionalCodeFormDialog
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

