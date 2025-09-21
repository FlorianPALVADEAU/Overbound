'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Plus } from 'lucide-react'
import { EventFormDialog, EventFormValues } from './EventFormDialog'
import { EventsEmptyState } from './EventsEmptyState'
import { EventList } from './EventList'
import type { Event } from '@/types/Event'
import {
  adminEventsQueryKey,
  createAdminEvent,
  deleteAdminEvent,
  updateAdminEvent,
  useAdminEvents,
  type AdminEventPayload,
} from '@/app/api/admin/events/eventsQueries'

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

export function EventsSection() {
  const queryClient = useQueryClient()
  const {
    data: events = [],
    isLoading,
    error: queryError,
  } = useAdminEvents()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create')
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [formValues, setFormValues] = useState<EventFormValues>(buildFormValues())
  const [submitting, setSubmitting] = useState(false)
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null)
  const [message, setMessage] = useState<MessageState | null>(null)

  const hasEvents = events.length > 0

  const handleCreateClick = () => {
    setDialogMode('create')
    setSelectedEvent(null)
    setFormValues(buildFormValues())
    setDialogOpen(true)
  }

  const handleEdit = (event: Event) => {
    setDialogMode('edit')
    setSelectedEvent(event)
    setFormValues(buildFormValues(event))
    setDialogOpen(true)
  }

  const handleDelete = async (event: Event) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${event.title}" ?`)) {
      return
    }

    setDeleteLoadingId(event.id)
    try {
      await deleteAdminEvent(event.id)
      queryClient.setQueryData<Event[]>(adminEventsQueryKey, (previous) => {
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
        queryClient.setQueryData<Event[]>(adminEventsQueryKey, (previous) => {
          if (!previous) return [created]
          return [created, ...previous]
        })
        setMessage({ type: 'success', text: 'Événement créé avec succès' })
      } else if (selectedEvent) {
        const updated = await updateAdminEvent(selectedEvent.id, payload)
        queryClient.setQueryData<Event[]>(adminEventsQueryKey, (previous) => {
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

  const alertVariant = message?.type === 'error' ? 'destructive' : 'default'

  const renderContent = () => {
    if (isLoading) {
      return (
        <Card className="p-8 text-center text-muted-foreground">
          Chargement des événements...
        </Card>
      )
    }

    if (queryError) {
      return (
        <Card className="p-8 text-center text-destructive">
          {(queryError as Error).message || 'Erreur lors du chargement des événements'}
        </Card>
      )
    }

    if (!hasEvents) {
      return <EventsEmptyState onCreate={handleCreateClick} />
    }

    return (
      <EventList
        events={events}
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
          <h2 className="text-2xl font-bold">Gestion des événements</h2>
          <p className="text-muted-foreground">Créer, modifier et gérer vos événements sportifs.</p>
        </div>
        <Button onClick={handleCreateClick}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvel événement
        </Button>
      </div>

      {message && (
        <Alert variant={alertVariant}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {renderContent()}

      <EventFormDialog
        open={dialogOpen}
        mode={dialogMode}
        initialValues={formValues}
        loading={submitting}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
