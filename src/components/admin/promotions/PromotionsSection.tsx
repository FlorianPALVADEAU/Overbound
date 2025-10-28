'use client'

import { useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AdminDataGrid, type AdminDataGridColumn } from '@/components/admin/ui/AdminDataGrid'
import { PromotionFormDialog, type PromotionFormValues } from './PromotionFormDialog'
import {
  adminPromotionsQueryKey,
  createAdminPromotion,
  deleteAdminPromotion,
  updateAdminPromotion,
  useAdminPromotions,
  type AdminPromotionPayload,
} from '@/app/api/admin/promotions/promotionsQueries'
import type { Promotion } from '@/types/Promotion'
import { Plus, Search } from 'lucide-react'

interface MessageState {
  type: 'success' | 'error'
  text: string
}

type StatusFilter = 'all' | 'running' | 'upcoming' | 'expired' | 'inactive'

const DEFAULT_FORM_VALUES: PromotionFormValues = {
  title: '',
  description: '',
  link_url: '',
  link_text: "Découvrir l'offre",
  starts_at: '',
  ends_at: '',
  is_active: true,
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
    title: promotion.title,
    description: promotion.description,
    link_url: promotion.link_url,
    link_text: promotion.link_text || "Découvrir l'offre",
    starts_at: dateToInputValue(promotion.starts_at),
    ends_at: dateToInputValue(promotion.ends_at),
    is_active: promotion.is_active,
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
  const queryClient = useQueryClient()
  const {
    data: promotions = [],
    isLoading,
    error,
    isFetching,
  } = useAdminPromotions()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create')
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null)
  const [formValues, setFormValues] = useState<PromotionFormValues>(DEFAULT_FORM_VALUES)
  const [submitting, setSubmitting] = useState(false)
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null)
  const [message, setMessage] = useState<MessageState | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const filteredPromotions = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    const now = new Date()

    return promotions.filter((promotion) => {
      const linkText = (promotion.link_text ?? '').toLowerCase()
      const matchesSearch =
        !term ||
        promotion.title.toLowerCase().includes(term) ||
        promotion.description.toLowerCase().includes(term) ||
        linkText.includes(term)

      if (!matchesSearch) {
        return false
      }

      if (statusFilter === 'all') {
        return true
      }

      const status = getPromotionStatus(promotion)

      if (statusFilter === 'running') {
        return status === 'running'
      }
      if (statusFilter === 'upcoming') {
        return status === 'upcoming'
      }
      if (statusFilter === 'expired') {
        return status === 'expired'
      }
      if (statusFilter === 'inactive') {
        if (!promotion.is_active) {
          return true
        }
        const endsAt = new Date(promotion.ends_at)
        return Number.isNaN(endsAt.getTime()) ? false : endsAt < now
      }

      return true
    })
  }, [promotions, searchTerm, statusFilter])

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
    if (!values.title || !values.description || !values.link_url || !trimmedLinkText || !values.starts_at || !values.ends_at) {
      setMessage({ type: 'error', text: 'Complétez tous les champs obligatoires' })
      return
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
      title: values.title,
      description: values.description,
      link_url: values.link_url,
      link_text: trimmedLinkText,
      starts_at: startsAtIso,
      ends_at: endsAtIso,
      is_active: values.is_active,
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
        setMessage({ type: 'success', text: 'Promotion créée avec succès' })
      } else if (selectedPromotion) {
        const updated = await updateAdminPromotion(selectedPromotion.id, payload)
        queryClient.setQueryData<Promotion[]>(adminPromotionsQueryKey, (previous) => {
          if (!previous) return [updated]
          return previous.map((item) => (item.id === updated.id ? updated : item))
        })
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

  const columns: AdminDataGridColumn<Promotion>[] = [
    {
      key: 'title',
      header: 'Promotion',
      cell: (promotion) => (
        <div className="space-y-1">
          <p className="font-medium">{promotion.title}</p>
          <p className="text-sm text-muted-foreground">{promotion.description}</p>
        </div>
      ),
    },
    {
      key: 'period',
      header: 'Période',
      cell: (promotion) => (
        <div className="text-sm text-muted-foreground">{formatPeriod(promotion)}</div>
      ),
    },
    {
      key: 'link',
      header: 'Lien',
      cell: (promotion) => (
        <a
          href={promotion.link_url}
          target={/^https?:\/\//i.test(promotion.link_url) ? '_blank' : undefined}
          rel={/^https?:\/\//i.test(promotion.link_url) ? 'noopener noreferrer' : undefined}
          className="text-sm text-primary underline-offset-2 hover:underline"
        >
          {promotion.link_url}
        </a>
      ),
    },
    {
      key: 'link_text',
      header: 'Texte CTA',
      cell: (promotion) => (
        <span className="text-sm font-medium text-muted-foreground">{promotion.link_text}</span>
      ),
    },
    {
      key: 'status',
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
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      cell: (promotion) => (
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => handleEdit(promotion)}>
            Modifier
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleDelete(promotion)}
            disabled={deleteLoadingId === promotion.id}
          >
            {deleteLoadingId === promotion.id ? 'Suppression…' : 'Supprimer'}
          </Button>
        </div>
      ),
    },
  ]

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

      <AdminDataGrid
        data={filteredPromotions}
        columns={columns}
        loading={isLoading}
        fetching={isFetching}
        emptyMessage="Aucune promotion pour le moment."
        toolbar={
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative w-full sm:max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Rechercher une promotion..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
                <SelectTrigger className="sm:w-48">
                  <SelectValue placeholder="Filtrer par statut" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(statusLabelMap).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleCreateClick} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle promotion
            </Button>
          </div>
        }
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
