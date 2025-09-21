'use client'

import { useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Search } from 'lucide-react'
import type { Ticket } from '@/types/Ticket'
import { TicketFormDialog, TicketFormValues } from './TicketFormDialog'
import { TicketList } from './TicketList'
import { TicketsEmptyState } from './TicketsEmptyState'
import {
  adminTicketsQueryKey,
  createAdminTicket,
  deleteAdminTicket,
  updateAdminTicket,
  useAdminTickets,
  type AdminTicketPayload,
} from '@/app/api/admin/tickets/ticketsQueries'
import { useAdminEvents } from '@/app/api/admin/events/eventsQueries'
import { useAdminRaces } from '@/app/api/admin/races/racesQueries'

interface MessageState {
  type: 'success' | 'error'
  text: string
}

function buildFormValues(ticket?: Ticket): TicketFormValues {
  if (!ticket) {
    return {
      event_id: '',
      race_id: 'none',
      name: '',
      description: '',
      price: '0',
      currency: 'eur',
      max_participants: '0',
      requires_document: false,
      document_types: [],
    }
  }

  return {
    event_id: ticket.event_id,
    race_id: ticket.race?.id || 'none',
    name: ticket.name,
    description: ticket.description || '',
    price: ticket.base_price_cents?.toString() || '0',
    currency: ticket.currency || 'eur',
    max_participants: ticket.max_participants.toString(),
    requires_document: ticket.requires_document,
    document_types: ticket.document_types || [],
  }
}

export function TicketsSection() {
  const queryClient = useQueryClient()
  const {
    data: tickets = [],
    isLoading: ticketsLoading,
    error: ticketsError,
  } = useAdminTickets()
  const {
    data: events = [],
    isLoading: eventsLoading,
    error: eventsError,
  } = useAdminEvents()
  const {
    data: races = [],
    isLoading: racesLoading,
    error: racesError,
  } = useAdminRaces()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create')
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [formValues, setFormValues] = useState<TicketFormValues>(buildFormValues())
  const [submitting, setSubmitting] = useState(false)
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null)
  const [message, setMessage] = useState<MessageState | null>(null)
  const [eventFilter, setEventFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const filteredTickets = useMemo(() => {
    let result = [...tickets]

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter((ticket) => {
        const matchesName = ticket.name.toLowerCase().includes(term)
        const matchesEvent = ticket.event?.title.toLowerCase().includes(term)
        const matchesRace = ticket.race?.name.toLowerCase().includes(term)
        return matchesName || matchesEvent || matchesRace
      })
    }

    if (eventFilter !== 'all') {
      result = result.filter((ticket) => ticket.event_id === eventFilter)
    }

    return result
  }, [tickets, searchTerm, eventFilter])

  const hasTickets = filteredTickets.length > 0
  const combinedLoading = ticketsLoading || eventsLoading || racesLoading
  const combinedError = ticketsError || eventsError || racesError

  const handleCreateClick = () => {
    setDialogMode('create')
    setSelectedTicket(null)
    setFormValues(buildFormValues())
    setDialogOpen(true)
  }

  const handleEdit = (ticket: Ticket) => {
    setDialogMode('edit')
    setSelectedTicket(ticket)
    setFormValues(buildFormValues(ticket))
    setDialogOpen(true)
  }

  const handleDelete = async (ticket: Ticket) => {
    if (!confirm(`Supprimer le ticket "${ticket.name}" ?`)) {
      return
    }

    setDeleteLoadingId(ticket.id)
    try {
      await deleteAdminTicket(ticket.id)
      queryClient.setQueryData<Ticket[]>(adminTicketsQueryKey, (previous) => {
        if (!previous) return []
        return previous.filter((item) => item.id !== ticket.id)
      })
      setMessage({ type: 'success', text: 'Ticket supprimé avec succès' })
    } catch (error) {
      const text = axios.isAxiosError(error)
        ? error.response?.data?.error || error.message
        : (error as Error).message || 'Erreur lors de la suppression'
      setMessage({ type: 'error', text })
    } finally {
      setDeleteLoadingId(null)
    }
  }

  const handleSubmit = async (values: TicketFormValues) => {
    if (!values.name || !values.event_id || !values.price) {
      setMessage({ type: 'error', text: 'Veuillez remplir les champs obligatoires' })
      return
    }

    setSubmitting(true)
    setMessage(null)

    const payload: AdminTicketPayload = {
      event_id: values.event_id,
      race_id: values.race_id === 'none' ? null : values.race_id,
      name: values.name,
      description: values.description || null,
      price: parseInt(values.price, 10) || 0,
      currency: values.currency || 'eur',
      max_participants: parseInt(values.max_participants, 10) || 0,
      requires_document: values.requires_document,
      document_types: values.requires_document ? values.document_types : [],
    }

    try {
      if (dialogMode === 'create') {
        const created = await createAdminTicket(payload)
        queryClient.setQueryData<Ticket[]>(adminTicketsQueryKey, (previous) => {
          if (!previous) return [created]
          return [created, ...previous]
        })
        setMessage({ type: 'success', text: 'Ticket créé avec succès' })
      } else if (selectedTicket) {
        const updated = await updateAdminTicket(selectedTicket.id, payload)
        queryClient.setQueryData<Ticket[]>(adminTicketsQueryKey, (previous) => {
          if (!previous) return [updated]
          return previous.map((item) => (item.id === selectedTicket.id ? updated : item))
        })
        setMessage({ type: 'success', text: 'Ticket mis à jour avec succès' })
      }

      setDialogOpen(false)
      setSelectedTicket(null)
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
    if (combinedLoading) {
      return (
        <Card className="p-8 text-center text-muted-foreground">
          Chargement des tickets...
        </Card>
      )
    }

    if (combinedError) {
      return (
        <Card className="p-8 text-center text-destructive">
          {(combinedError as Error).message || 'Erreur lors du chargement des tickets'}
        </Card>
      )
    }

    if (!hasTickets) {
      return <TicketsEmptyState onCreate={handleCreateClick} />
    }

    return (
      <TicketList
        tickets={filteredTickets}
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
          <h2 className="text-2xl font-bold">Gestion des tickets</h2>
          <p className="text-muted-foreground">Créez et modifiez vos billets et leurs contraintes.</p>
        </div>
        <Button onClick={handleCreateClick}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau ticket
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Rechercher un ticket"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
        <Select value={eventFilter} onValueChange={(value) => setEventFilter(value)}>
          <SelectTrigger>
            <SelectValue placeholder="Filtrer par événement" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les événements</SelectItem>
            {events.map((event) => (
              <SelectItem key={event.id} value={event.id}>
                {event.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {message && (
        <Alert variant={alertVariant}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {renderContent()}

      <TicketFormDialog
        open={dialogOpen}
        mode={dialogMode}
        events={events}
        races={races}
        initialValues={formValues}
        loading={submitting}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
