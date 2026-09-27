'use client'

import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { OperationsList, type OperationsListAction, type OperationsListColumn } from '@/components/admin/operations'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { parseOperationsListUrlState, writeOperationsListUrlState } from '@/components/admin/operations/operationsListUrlState'
import type { PromotionalCode } from '@/types/PromotionalCode'
import { PromotionalCodeFormDialog, type PromotionalCodeFormValues } from './PromotionalCodeFormDialog'
import {
  adminPromotionalCodesQueryKey,
  createAdminPromotionalCode,
  deleteAdminPromotionalCode,
  updateAdminPromotionalCode,
  useAdminPromotionalCodesPage,
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
      tier_order: '',
      auto_activate: false,
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
    tier_order: code.tier_order?.toString() || '',
    auto_activate: code.auto_activate || false,
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
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const initialUrl = useMemo(() => parseOperationsListUrlState(searchParams, { filterIds: ['status'] }), [searchParams])
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const deferredSearch = useDeferredValue(searchTerm.trim())
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>((initialUrl.filters.status as 'all' | 'active' | 'inactive' | undefined) ?? 'all')
  const [cursor, setCursor] = useState<string | null>(initialUrl.cursor)
  const [previousCursors, setPreviousCursors] = useState<string[]>([])
  const [limit, setLimit] = useState(initialUrl.limit)
  const { data: pageData, isLoading, isFetching, error: promotionalCodesError } = useAdminPromotionalCodesPage({ cursor, limit, query: deferredSearch || undefined, status: statusFilter })
  const promotionalCodes = pageData?.promotionalCodes ?? []
  const { data: events = [] } = useAdminEvents()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create')
  const [selectedCode, setSelectedCode] = useState<PromotionalCode | null>(null)
  const [formValues, setFormValues] = useState<PromotionalCodeFormValues>(buildFormValues())
  const [submitting, setSubmitting] = useState(false)
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null)
  const [message, setMessage] = useState<MessageState | null>(null)
  const filteredCodes = promotionalCodes
  const resetPagination = () => { setCursor(null); setPreviousCursors([]) }
  useEffect(() => { resetPagination() }, [deferredSearch])
  useEffect(() => { const next = writeOperationsListUrlState(searchParams, { cursor, sort: null, direction: null, limit, selectedId: null, filters: { status: statusFilter === 'all' ? '' : statusFilter } }, { filterIds: ['status'] }); if (next !== searchParams.toString()) router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false }) }, [cursor, limit, pathname, router, searchParams, statusFilter])

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
      await queryClient.invalidateQueries({ queryKey: adminPromotionalCodesQueryKey })
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

    const trimmedTierOrder = values.tier_order.trim()
    const parsedTierOrder = trimmedTierOrder ? parseInt(trimmedTierOrder, 10) : null

    if (trimmedTierOrder && Number.isNaN(parsedTierOrder)) {
      setMessage({ type: 'error', text: 'L\'ordre du palier doit être un nombre positif.' })
      setSubmitting(false)
      return
    }

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
      tier_order: parsedTierOrder,
      auto_activate: values.auto_activate,
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

      await queryClient.invalidateQueries({ queryKey: adminPromotionalCodesQueryKey })

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

  const columns = useMemo<OperationsListColumn<PromotionalCode>[]>(() => {
    return [
      {
        id: 'code',
        header: 'Code',
        cell: (code) => (
          <div className="flex flex-col gap-1">
            <span className="font-semibold uppercase">{code.code}</span>
            <span className="text-xs text-muted-foreground">{code.name}</span>
          </div>
        ),
      },
      {
        id: 'discount',
        header: 'Remise',
        cell: (code) => (
          <span className="font-medium text-primary">{discountLabel(code)}</span>
        ),
      },
      {
        id: 'validity',
        header: 'Validité',
        cell: (code) => (
          <div className="flex flex-col text-xs text-muted-foreground">
            <span>Du {formatDate(code.valid_from)}</span>
            <span>Au {formatDate(code.valid_until)}</span>
          </div>
        ),
      },
      {
        id: 'usage',
        header: 'Utilisation',
        cell: (code) => (
          <span>
            {code.used_count} / {code.usage_limit ?? '∞'} utilisés
          </span>
        ),
      },
      {
        id: 'status',
        header: 'Statut',
        cell: (code) => (
          <Badge variant={code.is_active ? 'default' : 'secondary'}>
            {code.is_active ? 'Actif' : 'Inactif'}
          </Badge>
        ),
      },
    ]
  }, [])

  const rowActions = useMemo<OperationsListAction<PromotionalCode>[]>(() => [
    { id: 'edit', label: 'Modifier', onSelect: handleEdit },
    { id: 'delete', label: 'Supprimer', destructive: true, disabled: (code) => deleteLoadingId === code.id, onSelect: handleDelete },
  ], [deleteLoadingId])

  const alertVariant = message?.type === 'error' ? 'destructive' : 'default'

  const emptyMessage = searchTerm || statusFilter !== 'all'
    ? 'Aucun code ne correspond aux filtres appliqués.'
    : 'Aucun code promotionnel enregistré.'

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

      <OperationsList
        data={{ items: filteredCodes, nextCursor: pageData?.page.nextCursor ?? null, total: pageData?.page.totalCount }}
        status={promotionalCodesError ? 'error' : isLoading && !pageData ? 'loading' : isFetching ? 'stale' : 'idle'}
        errorMessage={promotionalCodesError?.message}
        onRetry={() => window.location.reload()}
        getItemId={(code) => code.id}
        columns={columns}
        filters={[
          { id: 'status', label: 'Statut', value: statusFilter === 'all' ? '' : statusFilter, options: [{ value: 'active', label: 'Actifs' }, { value: 'inactive', label: 'Inactifs' }] },
          { id: 'limit', label: 'Lignes', value: String(limit), options: [25, 50, 100].map((value) => ({ value: String(value), label: String(value) })) },
        ]}
        onFilterChange={(id, value) => { resetPagination(); if (id === 'status') setStatusFilter((value || 'all') as typeof statusFilter); if (id === 'limit') setLimit(Number(value)) }}
        search={searchTerm}
        searchPlaceholder="Rechercher par code, nom ou description…"
        onSearchChange={setSearchTerm}
        rowActions={rowActions}
        pagination={{ cursor, previousCursors, nextCursor: pageData?.page.nextCursor ?? null, total: pageData?.page.totalCount, limit }}
        onPaginationChange={({ cursor: nextCursor, previousCursors: nextPreviousCursors }) => { setCursor(nextCursor); setPreviousCursors(nextPreviousCursors) }}
        itemLabel="code"
        emptyState={<div className="px-3 py-12 text-center text-sm text-muted-foreground">{emptyMessage}</div>}
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
