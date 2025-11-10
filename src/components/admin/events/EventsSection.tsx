'use client'

import { useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import Link from 'next/link'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Search } from 'lucide-react'
import { EventFormDialog, type EventFormValues } from './EventFormDialog'
import type { Event } from '@/types/Event'
import type { EventPriceTier } from '@/types/EventPriceTier'
import {
  adminEventsQueryKey,
  createAdminEvent,
  deleteAdminEvent,
  updateAdminEvent,
  useAdminEvents,
  type AdminEventPayload,
  type AdminEventSummary,
} from '@/app/api/admin/events/eventsQueries'
import { AdminDataGrid, type AdminDataGridColumn } from '@/components/admin/ui/AdminDataGrid'
import axiosClient from '@/app/api/axiosClient'

interface MessageState {
  type: 'success' | 'error'
  text: string
}

function buildFormValues(event?: Event): EventFormValues {
  if (!event) {
    return {
      slug: '',
      title: '',
      subtitle: '',
      description: '',
      date: '',
      location: '',
      latitude: '',
      longitude: '',
      capacity: '0',
      status: 'draft',
      external_provider: 'none',
      external_event_id: '',
      external_url: '',
    }
  }

  return {
    slug: event.slug,
    title: event.title,
    subtitle: event.subtitle || '',
    description: event.description || '',
    date: new Date(event.date).toISOString().slice(0, 16),
    location: event.location,
    latitude: event.latitude?.toString() || '',
    longitude: event.longitude?.toString() || '',
    capacity: event.capacity.toString(),
    status: event.status,
    external_provider: event.external_provider || 'none',
    external_event_id: event.external_event_id || '',
    external_url: event.external_url || '',
  }
}

function toPayload(values: EventFormValues): AdminEventPayload {
  return {
    slug: values.slug,
    title: values.title,
    subtitle: values.subtitle || null,
    date: new Date(values.date).toISOString(),
    location: values.location,
    latitude: values.latitude ? parseFloat(values.latitude) : null,
    longitude: values.longitude ? parseFloat(values.longitude) : null,
    capacity: parseInt(values.capacity, 10) || 0,
    status: values.status,
    external_provider: values.external_provider === 'none' ? null : values.external_provider,
    external_event_id: values.external_provider === 'none' ? null : values.external_event_id || null,
    external_url: values.external_provider === 'none' ? null : values.external_url || null,
  }
}

const statusVariant = (status: Event['status']) => {
  switch (status) {
    case 'on_sale':
      return 'default' as const
    case 'draft':
      return 'secondary' as const
    case 'sold_out':
    case 'closed':
      return 'outline' as const
    case 'cancelled':
      return 'destructive' as const
    case 'completed':
      return 'secondary' as const
    default:
      return 'secondary' as const
  }
}

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

export function EventsSection() {
  const queryClient = useQueryClient()
  const {
    data: events = [],
    isLoading,
    error: queryError,
  } = useAdminEvents()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create')
  const [selectedEvent, setSelectedEvent] = useState<AdminEventSummary | null>(null)
  const [formValues, setFormValues] = useState<EventFormValues>(buildFormValues())
  const [submitting, setSubmitting] = useState(false)
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null)
  const [message, setMessage] = useState<MessageState | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | Event['status']>('all')
  const [priceTiers, setPriceTiers] = useState<EventPriceTier[]>([])
  const [loadingPriceTiers, setLoadingPriceTiers] = useState(false)

  const filteredEvents = useMemo(() => {
    let result = [...events]

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      result = result.filter((event) => {
        return (
          event.title.toLowerCase().includes(term) ||
          event.slug.toLowerCase().includes(term) ||
          event.location.toLowerCase().includes(term)
        )
      })
    }

    if (statusFilter !== 'all') {
      result = result.filter((event) => event.status === statusFilter)
    }

    return result
  }, [events, searchTerm, statusFilter])

  const handleCreateClick = () => {
    setDialogMode('create')
    setSelectedEvent(null)
    setFormValues(buildFormValues())
    setPriceTiers([])
    setDialogOpen(true)
  }

  const handleEdit = async (event: AdminEventSummary) => {
    setDialogMode('edit')
    setSelectedEvent(event)
    setFormValues(buildFormValues(event))
    setPriceTiers([])
    setDialogOpen(true)

    // Fetch price tiers for this event
    setLoadingPriceTiers(true)
    try {
      const response = await axiosClient.get<{ event: Event & { price_tiers?: EventPriceTier[] } }>(
        `/admin/events/${event.id}`
      )
      if (response.data.event.price_tiers) {
        setPriceTiers(response.data.event.price_tiers)
      }
    } catch (error) {
      console.error('Error loading price tiers:', error)
    } finally {
      setLoadingPriceTiers(false)
    }
  }

  const handleDelete = async (event: AdminEventSummary) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${event.title}" ?`)) {
      return
    }

    setDeleteLoadingId(event.id)
    try {
      await deleteAdminEvent(event.id)
      queryClient.setQueryData<AdminEventSummary[]>(adminEventsQueryKey, (previous) => {
        if (!previous) return []
        return previous.filter((item) => item.id !== event.id)
      })
      setMessage({ type: 'success', text: 'Événement supprimé avec succès' })
    } catch (error) {
      const text = axios.isAxiosError(error)
        ? error.response?.data?.error || error.message
        : (error as Error).message || 'Erreur lors de la suppression'
      setMessage({ type: 'error', text })
    } finally {
      setDeleteLoadingId(null)
    }
  }

  const handleSubmit = async (values: EventFormValues) => {
    if (!values.title || !values.date || !values.location) {
      setMessage({ type: 'error', text: 'Veuillez remplir tous les champs obligatoires' })
      return
    }

    setSubmitting(true)
    setMessage(null)

    try {
      const payload = toPayload(values)
      if (dialogMode === 'create') {
        const created = await createAdminEvent(payload)
        queryClient.setQueryData<AdminEventSummary[]>(adminEventsQueryKey, (previous) => {
          if (!previous) return [created]
          return [created, ...previous]
        })
        setMessage({ type: 'success', text: 'Événement créé avec succès' })
      } else if (selectedEvent) {
        const updated = await updateAdminEvent(selectedEvent.id, payload)
        queryClient.setQueryData<AdminEventSummary[]>(adminEventsQueryKey, (previous) => {
          if (!previous) return [updated]
          return previous.map((item) => (item.id === selectedEvent.id ? updated : item))
        })
        setMessage({ type: 'success', text: 'Événement mis à jour avec succès' })
      }

      setDialogOpen(false)
      setSelectedEvent(null)
    } catch (error) {
      const text = axios.isAxiosError(error)
        ? error.response?.data?.error || error.message
        : (error as Error).message || 'Erreur lors de la sauvegarde'
      setMessage({ type: 'error', text })
    } finally {
      setSubmitting(false)
    }
  }

  const columns = useMemo<AdminDataGridColumn<AdminEventSummary>[]>(() => {
    return [
      {
        key: 'title',
        header: 'Événement',
        cell: (event) => (
          <div className="flex flex-col gap-1">
            <span className="font-semibold">{event.title}</span>
            <span className="text-xs text-muted-foreground">Slug : {event.slug}</span>
          </div>
        ),
      },
      {
        key: 'date',
        header: 'Date & heure',
        cell: (event) => <span>{formatDateTime(event.date)}</span>,
      },
      {
        key: 'location',
        header: 'Lieu',
        cell: (event) => (
          <div className="flex flex-col">
            <span>{event.location}</span>
            <span className="text-xs text-muted-foreground">Capacité : {event.capacity}</span>
          </div>
        ),
      },
      {
        key: 'status',
        header: 'Statut',
        cell: (event) => (
          <Badge variant={statusVariant(event.status)} className="capitalize">
            {event.status.replace('_', ' ')}
          </Badge>
        ),
      },
      {
        key: 'attendees',
        header: 'Participants',
        cell: (event) => (
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-foreground">
              {(event.registrations_count ?? 0).toLocaleString('fr-FR')} coureur
              {event.registrations_count === 1 ? '' : 's'}
            </span>
            <span className="text-xs text-muted-foreground">
              {(event.volunteer_applications_count ?? 0).toLocaleString('fr-FR')} bénévole
              {event.volunteer_applications_count === 1 ? '' : 's'}
            </span>
          </div>
        ),
      },
      {
        key: 'updated_at',
        header: 'Dernière mise à jour',
        cell: (event) => (
          <span className="text-sm text-muted-foreground">{formatDateTime(event.updated_at)}</span>
        ),
      },
      {
        key: 'actions',
        header: '',
        className: 'w-[220px]',
        cell: (event) => (
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" asChild>
              <Link href={`/dashboard/events/${event.id}`}>Voir</Link>
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleEdit(event)}>
              Modifier
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleDelete(event)}
              disabled={deleteLoadingId === event.id}
            >
              {deleteLoadingId === event.id ? 'Suppression…' : 'Supprimer'}
            </Button>
          </div>
        ),
      },
    ]
  }, [deleteLoadingId, handleDelete, handleEdit])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestion des événements</h2>
          <p className="text-muted-foreground">
            Gérez vos événements, leurs statuts et leurs capacités.
          </p>
        </div>
        <Button onClick={handleCreateClick}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvel événement
        </Button>
      </div>

      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {queryError ? (
        <Alert variant="destructive">
          <AlertDescription>
            {queryError.message || 'Impossible de charger les événements'}
          </AlertDescription>
        </Alert>
      ) : null}

      <AdminDataGrid
        data={filteredEvents}
        columns={columns}
        loading={isLoading}
        emptyMessage={
          searchTerm || statusFilter !== 'all'
            ? 'Aucun événement ne correspond aux filtres appliqués.'
            : 'Aucun événement enregistré. Créez votre premier événement pour commencer.'
        }
        toolbar={
          <div className="grid gap-3 md:grid-cols-3">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Rechercher par titre, slug ou lieu…"
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
                <SelectItem value="draft">Brouillon</SelectItem>
                <SelectItem value="on_sale">En vente</SelectItem>
                <SelectItem value="sold_out">Complet</SelectItem>
                <SelectItem value="closed">Clôturé</SelectItem>
                <SelectItem value="cancelled">Annulé</SelectItem>
                <SelectItem value="completed">Terminé</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
        meta={
          <span>
            {filteredEvents.length} événement{filteredEvents.length > 1 ? 's' : ''} affiché
          </span>
        }
        getRowId={(event) => event.id}
      />

      <EventFormDialog
        open={dialogOpen}
        mode={dialogMode}
        initialValues={formValues}
        loading={submitting}
        eventId={selectedEvent?.id}
        priceTiers={priceTiers}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        onPriceTiersChange={setPriceTiers}
      />
    </div>
  )
}
