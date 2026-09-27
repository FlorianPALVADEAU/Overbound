'use client'

import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { OperationsList, type OperationsListAction, type OperationsListColumn } from '@/components/admin/operations'
import { parseOperationsListUrlState, writeOperationsListUrlState } from '@/components/admin/operations/operationsListUrlState'
import { PromotionFormDialog, type PromotionFormValues } from './PromotionFormDialog'
import {
  adminPromotionsQueryKey,
  createAdminPromotion,
  deleteAdminPromotion,
  updateAdminPromotion,
  useAdminPromotionsPage,
  type AdminPromotionPayload,
} from '@/app/api/admin/promotions/promotionsQueries'
import type { Promotion } from '@/types/Promotion'
import { Plus } from 'lucide-react'

interface MessageState {
  type: 'success' | 'error'
  text: string
}

type StatusFilter = 'all' | 'running' | 'upcoming' | 'expired' | 'inactive'

const DEFAULT_FORM_VALUES: PromotionFormValues = {
  type: 'banner',
  title: '',
  description: '',
  link_url: '',
  link_text: "Découvrir l'offre",
  starts_at: '',
  ends_at: '',
  is_active: true,
  popup_config: null,
}

const dateToInputValue = (value: string | null | undefined) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const offsetMs = date.getTimezoneOffset() * 60 * 1000
  const localDate = new Date(date.getTime() - offsetMs)
  return localDate.toISOString().slice(0, 16)
}

const inputValueToIso = (value: string) => {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

function buildFormValues(promotion?: Promotion): PromotionFormValues {
  if (!promotion) {
    return { ...DEFAULT_FORM_VALUES }
  }

  return {
    type: promotion.type,
    title: promotion.title,
    description: promotion.description,
    link_url: promotion.link_url,
    link_text: promotion.link_text || "Découvrir l'offre",
    starts_at: dateToInputValue(promotion.starts_at),
    ends_at: dateToInputValue(promotion.ends_at),
    is_active: promotion.is_active,
    popup_config: promotion.popup_config,
  }
}

const formatDateTime = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

const formatPeriod = (promotion: Promotion) =>
  `Du ${formatDateTime(promotion.starts_at)} au ${formatDateTime(promotion.ends_at)}`

const getPromotionStatus = (promotion: Promotion): StatusFilter => {
  if (!promotion.is_active) return 'inactive'
  const now = new Date()
  const startsAt = new Date(promotion.starts_at)
  const endsAt = new Date(promotion.ends_at)
  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
    return 'inactive'
  }
  if (now < startsAt) return 'upcoming'
  if (now > endsAt) return 'expired'
  return 'running'
}

const statusLabelMap: Record<StatusFilter, string> = {
  all: 'Tous',
  running: 'En cours',
  upcoming: 'À venir',
  expired: 'Terminées',
  inactive: 'Inactives',
}

const statusBadgeConfig: Record<
  Exclude<StatusFilter, 'all'>,
  { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }
> = {
  running: { label: 'En cours', variant: 'default' },
  upcoming: { label: 'À venir', variant: 'secondary' },
  expired: { label: 'Terminée', variant: 'outline' },
  inactive: { label: 'Inactive', variant: 'destructive' },
}

export function PromotionsSection() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const initialUrl = useMemo(() => parseOperationsListUrlState(searchParams, { filterIds: ['status'] }), [searchParams])
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const deferredSearch = useDeferredValue(searchTerm.trim())
  const [statusFilter, setStatusFilter] = useState<StatusFilter>((initialUrl.filters.status as StatusFilter | undefined) ?? 'all')
  const [limit, setLimit] = useState(initialUrl.limit)
  const [cursor, setCursor] = useState<string | null>(initialUrl.cursor)
  const [previousCursors, setPreviousCursors] = useState<string[]>([])
  const promotionParams = useMemo(() => ({
    cursor,
    limit,
    query: deferredSearch || undefined,
    status: statusFilter,
    sort: 'starts_at' as const,
    direction: 'desc' as const,
  }), [cursor, deferredSearch, limit, statusFilter])
  const { data: pageData, isLoading, isFetching, error } = useAdminPromotionsPage(promotionParams)
  const promotions = pageData?.promotions ?? []

  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create')
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null)
  const [formValues, setFormValues] = useState<PromotionFormValues>(DEFAULT_FORM_VALUES)
  const [submitting, setSubmitting] = useState(false)
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null)
  const [message, setMessage] = useState<MessageState | null>(null)
  const filteredPromotions = promotions
  const resetPagination = () => {
    setCursor(null)
    setPreviousCursors([])
  }

  useEffect(() => {
    resetPagination()
  }, [deferredSearch])

  useEffect(() => {
    const next = writeOperationsListUrlState(searchParams, {
      cursor,
      sort: null,
      direction: null,
      limit,
      selectedId: null,
      filters: { status: statusFilter === 'all' ? '' : statusFilter },
    }, { filterIds: ['status'] })
    if (next !== searchParams.toString()) {
      router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false })
    }
  }, [cursor, limit, pathname, router, searchParams, statusFilter])

  useEffect(() => {
    const next = parseOperationsListUrlState(searchParams, { filterIds: ['status'] })
    const nextStatus = Object.prototype.hasOwnProperty.call(statusLabelMap, next.filters.status)
      ? (next.filters.status as StatusFilter)
      : 'all'
    const hasExternalStateChange = statusFilter !== nextStatus || limit !== next.limit || cursor !== next.cursor
    setStatusFilter((current) => current === nextStatus ? current : nextStatus)
    setLimit((current) => current === next.limit ? current : next.limit)
    setCursor((current) => current === next.cursor ? current : next.cursor)
    if (hasExternalStateChange) setPreviousCursors([])
    // URL changes from browser navigation should restore controlled list state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const handleCreateClick = () => {
    setDialogMode('create')
    setSelectedPromotion(null)
    setFormValues({ ...DEFAULT_FORM_VALUES })
    setDialogOpen(true)
  }

  const handleEdit = (promotion: Promotion) => {
    setDialogMode('edit')
    setSelectedPromotion(promotion)
    setFormValues(buildFormValues(promotion))
    setDialogOpen(true)
  }

  const handleDelete = async (promotion: Promotion) => {
    if (!confirm(`Supprimer la promotion "${promotion.title}" ?`)) {
      return
    }

    setDeleteLoadingId(promotion.id)
    setMessage(null)

    try {
      await deleteAdminPromotion(promotion.id)
      queryClient.setQueryData<Promotion[]>(adminPromotionsQueryKey, (previous) => {
        if (!previous) return []
        return previous.filter((item) => item.id !== promotion.id)
      })
      await queryClient.invalidateQueries({ queryKey: adminPromotionsQueryKey })
      setMessage({ type: 'success', text: 'Promotion supprimée avec succès' })
    } catch (err) {
      const text = axios.isAxiosError(err)
        ? err.response?.data?.error || err.message
        : (err as Error).message || 'Erreur lors de la suppression'
      setMessage({ type: 'error', text })
    } finally {
      setDeleteLoadingId(null)
    }
  }

  const handleDialogSubmit = async (values: PromotionFormValues) => {
    const trimmedLinkText = values.link_text.trim()

    // Basic validation
    if (!values.title || !values.description || !values.link_url || !values.starts_at || !values.ends_at) {
      setMessage({ type: 'error', text: 'Complétez tous les champs obligatoires' })
      return
    }

    // Banner-specific validation
    if (values.type === 'banner' && !trimmedLinkText) {
      setMessage({ type: 'error', text: 'Le texte du lien est requis pour les bannières' })
      return
    }

    // Popup-specific validation
    if (values.type === 'popup') {
      if (!values.popup_config) {
        setMessage({ type: 'error', text: 'La configuration du popup est requise' })
        return
      }
      if (!values.popup_config.form_title || !values.popup_config.form_description || !values.popup_config.submit_button_text) {
        setMessage({ type: 'error', text: 'Complétez tous les champs obligatoires du popup' })
        return
      }
    }

    const startsAtIso = inputValueToIso(values.starts_at)
    const endsAtIso = inputValueToIso(values.ends_at)

    if (!startsAtIso || !endsAtIso) {
      setMessage({ type: 'error', text: 'Dates invalides' })
      return
    }

    if (new Date(endsAtIso) <= new Date(startsAtIso)) {
      setMessage({
        type: 'error',
        text: 'La date de fin doit être postérieure à la date de début',
      })
      return
    }

    const payload: AdminPromotionPayload = {
      type: values.type,
      title: values.title,
      description: values.description,
      link_url: values.link_url,
      link_text: trimmedLinkText,
      starts_at: startsAtIso,
      ends_at: endsAtIso,
      is_active: values.is_active,
      popup_config: values.popup_config,
    }

    setSubmitting(true)
    setMessage(null)

    try {
      if (dialogMode === 'create') {
        const created = await createAdminPromotion(payload)
        queryClient.setQueryData<Promotion[]>(adminPromotionsQueryKey, (previous) => {
          if (!previous) return [created]
          return [created, ...previous]
        })
        await queryClient.invalidateQueries({ queryKey: adminPromotionsQueryKey })
        setMessage({ type: 'success', text: 'Promotion créée avec succès' })
      } else if (selectedPromotion) {
        const updated = await updateAdminPromotion(selectedPromotion.id, payload)
        queryClient.setQueryData<Promotion[]>(adminPromotionsQueryKey, (previous) => {
          if (!previous) return [updated]
          return previous.map((item) => (item.id === updated.id ? updated : item))
        })
        await queryClient.invalidateQueries({ queryKey: adminPromotionsQueryKey })
        setMessage({ type: 'success', text: 'Promotion mise à jour avec succès' })
      }

      setDialogOpen(false)
      setSelectedPromotion(null)
    } catch (err) {
      const text = axios.isAxiosError(err)
        ? err.response?.data?.error || err.message
        : (err as Error).message || 'Erreur lors de l’enregistrement'
      setMessage({ type: 'error', text })
    } finally {
      setSubmitting(false)
    }
  }

  const columns = useMemo<OperationsListColumn<Promotion>[]>(() => [
    {
      id: 'title',
      header: 'Promotion',
      className: 'w-[250px] max-w-[250px]',
      cell: (promotion) => (
        <div className="min-w-0 space-y-1">
          <p className="line-clamp-2 font-medium">{promotion.title}</p>
          <p className="line-clamp-2 text-sm text-muted-foreground">{promotion.description}</p>
        </div>
      ),
    },
    {
      id: 'type',
      header: 'Type',
      cell: (promotion) => (
        <Badge variant={promotion.type === 'popup' ? 'secondary' : 'outline'}>
          {promotion.type === 'popup' ? 'Popup' : 'Bannière'}
        </Badge>
      ),
    },
    {
      id: 'period',
      header: 'Période',
      className: 'w-[190px] max-w-[190px]',
      cell: (promotion) => (
        <div className="text-sm leading-5 text-muted-foreground">{formatPeriod(promotion)}</div>
      ),
    },
    {
      id: 'link',
      header: 'Lien',
      className: 'w-[220px] max-w-[220px]',
      cell: (promotion) => (
        <a
          href={promotion.link_url}
          target={/^https?:\/\//i.test(promotion.link_url) ? '_blank' : undefined}
          rel={/^https?:\/\//i.test(promotion.link_url) ? 'noopener noreferrer' : undefined}
          className="block line-clamp-2 break-all text-sm text-primary underline-offset-2 hover:underline"
        >
          {promotion.link_url}
        </a>
      ),
    },
    {
      id: 'link_text',
      header: 'Texte CTA',
      className: 'w-[170px] max-w-[170px]',
      cell: (promotion) => (
        <span className="line-clamp-2 text-sm font-medium text-muted-foreground">{promotion.link_text}</span>
      ),
    },
    {
      id: 'status',
      header: 'Statut',
      cell: (promotion) => {
        const status = getPromotionStatus(promotion)
        if (status === 'all') {
          return null
        }
        const normalizedStatus = status as Exclude<StatusFilter, 'all'>
        const config = statusBadgeConfig[normalizedStatus]
        return (
          <Badge variant={config.variant}>
            {config.label}
          </Badge>
        )
      },
    },
  ], [])

  const rowActions = useMemo<OperationsListAction<Promotion>[]>(() => [
    { id: 'edit', label: 'Modifier', onSelect: handleEdit },
    {
      id: 'delete',
      label: 'Supprimer',
      destructive: true,
      disabled: (promotion) => deleteLoadingId === promotion.id,
      onSelect: handleDelete,
    },
  // Action handlers only use stable React setters/query client; the loading id
  // remains the sole dependency that changes the disabled state.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [deleteLoadingId])

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold">Bandeaux promotions</h2>
        <p className="text-sm text-muted-foreground">
          Gérez les annonces marketing affichées sous le header du site.
        </p>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>
            Impossible de charger les promotions. Veuillez réessayer plus tard.
          </AlertDescription>
        </Alert>
      ) : null}

      {message ? (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      ) : null}

      <OperationsList
        data={{
          items: filteredPromotions,
          nextCursor: pageData?.page.nextCursor ?? null,
          total: pageData?.page.totalCount,
        }}
        status={error ? 'error' : isLoading && !pageData ? 'loading' : isFetching ? 'stale' : 'idle'}
        errorMessage={error instanceof Error ? error.message : 'Impossible de charger les promotions.'}
        onRetry={() => window.location.reload()}
        getItemId={(promotion) => promotion.id}
        columns={columns}
        filters={[{
          id: 'status',
          label: 'Statut',
          value: statusFilter,
          options: Object.entries(statusLabelMap).map(([value, label]) => ({ value, label })),
        }, {
          id: 'limit',
          label: 'Lignes',
          value: String(limit),
          options: [25, 50, 100].map((value) => ({ value: String(value), label: String(value) })),
        }]}
        onFilterChange={(filterId, value) => {
          resetPagination()
          if (filterId === 'status') setStatusFilter((value || 'all') as StatusFilter)
          if (filterId === 'limit') setLimit(Number(value))
        }}
        search={searchTerm}
        searchPlaceholder="Rechercher une promotion…"
        onSearchChange={setSearchTerm}
        rowActions={rowActions}
        pagination={{
          cursor,
          previousCursors,
          nextCursor: pageData?.page.nextCursor ?? null,
          total: pageData?.page.totalCount,
          limit,
        }}
        onPaginationChange={({ cursor: nextCursor, previousCursors: nextPreviousCursors }) => {
          setCursor(nextCursor)
          setPreviousCursors(nextPreviousCursors)
        }}
        itemLabel="promotion"
        emptyState={<div className="px-3 py-12 text-center text-sm text-muted-foreground">Aucune promotion pour le moment.</div>}
      />

      <PromotionFormDialog
        open={dialogOpen}
        mode={dialogMode}
        initialValues={formValues}
        loading={submitting}
        onOpenChange={setDialogOpen}
        onSubmit={handleDialogSubmit}
      />
    </div>
  )
}
