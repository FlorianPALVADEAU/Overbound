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
import type { Ticket } from '@/types/Ticket'
import { TicketFormDialog, type TicketFormValues } from './TicketFormDialog'
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
      price_tiers: [
        {
          price_cents: '2000',
          available_from: '',
          available_until: '',
          display_order: 0,
        },
      ],
      use_price_tiers: false,
    }
  }

  // Check if ticket has price tiers
  const hasPriceTiers = Boolean(ticket.price_tiers && ticket.price_tiers.length > 0)

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
    price_tiers: hasPriceTiers
      ? ticket.price_tiers!.map((tier) => ({
          id: tier.id,
          price_cents: tier.price_cents.toString(),
          // Format date to YYYY-MM-DD
          available_from: tier.available_from
            ? new Date(tier.available_from).toISOString().slice(0, 10)
            : '',
          available_until: tier.available_until
            ? new Date(tier.available_until).toISOString().slice(0, 10)
            : '',
          display_order: tier.display_order,
        }))
      : [
          {
            price_cents: ticket.base_price_cents?.toString() || '2000',
            available_from: '',
            available_until: '',
            display_order: 0,
          },
        ],
    use_price_tiers: hasPriceTiers,
  }
}

const formatPrice = (cents: number | null | undefined, currency?: string | null) => {
  if (cents == null) {
    return 'Tarif non défini'
  }
  return (cents / 100).toLocaleString('fr-FR', {
    style: 'currency',
    currency: (currency || 'EUR').toUpperCase(),
  })
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

  const combinedLoading = ticketsLoading || eventsLoading || racesLoading
  const combinedError = ticketsError || eventsError || racesError

  const filteredTickets = useMemo(() => {
    let result = [...tickets]

    if (searchTerm.trim()) {
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
    if (!values.name || !values.event_id) {
      setMessage({ type: 'error', text: 'Veuillez remplir les champs obligatoires' })
      return
    }

    // Validate price tiers if enabled
    if (values.use_price_tiers) {
      if (!values.price_tiers || values.price_tiers.length === 0) {
        setMessage({ type: 'error', text: 'Au moins un palier de prix est requis' })
        return
      }
    } else {
      if (!values.price) {
        setMessage({ type: 'error', text: 'Le prix est requis' })
        return
      }
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
      let ticketId: string

      if (dialogMode === 'create') {
        const created = await createAdminTicket(payload)
        ticketId = created.id
        queryClient.setQueryData<Ticket[]>(adminTicketsQueryKey, (previous) => {
          if (!previous) return [created]
          return [created, ...previous]
        })
      } else if (selectedTicket) {
        ticketId = selectedTicket.id
        const updated = await updateAdminTicket(selectedTicket.id, payload)
        queryClient.setQueryData<Ticket[]>(adminTicketsQueryKey, (previous) => {
          if (!previous) return [updated]
          return previous.map((item) => (item.id === selectedTicket.id ? updated : item))
        })
      } else {
        throw new Error('No ticket selected for update')
      }

      // Handle price tiers if enabled
      if (values.use_price_tiers) {
        // Delete existing tiers if editing
        if (dialogMode === 'edit' && selectedTicket?.price_tiers) {
          await Promise.all(
            selectedTicket.price_tiers.map((tier) =>
              axios.delete(`/api/admin/ticket-price-tiers/${tier.id}`)
            )
          )
        }

        // Create new tiers
        await Promise.all(
          values.price_tiers.map((tier) =>
            axios.post('/api/admin/ticket-price-tiers', {
              ticket_id: ticketId,
              price_cents: parseInt(tier.price_cents, 10),
              available_from: tier.available_from || null,
              available_until: tier.available_until || null,
              display_order: tier.display_order,
            })
          )
        )
      } else if (dialogMode === 'edit' && selectedTicket?.price_tiers) {
        // User disabled price tiers, delete them
        await Promise.all(
          selectedTicket.price_tiers.map((tier) =>
            axios.delete(`/api/admin/ticket-price-tiers/${tier.id}`)
          )
        )
      }

      // Refresh tickets data to get updated tiers
      await queryClient.invalidateQueries({ queryKey: adminTicketsQueryKey })

      setMessage({
        type: 'success',
        text: dialogMode === 'create' ? 'Ticket créé avec succès' : 'Ticket mis à jour avec succès',
      })
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

  const columns = useMemo<AdminDataGridColumn<Ticket>[]>(() => {
    return [
      {
        key: 'ticket',
        header: 'Ticket',
        cell: (ticket) => (
          <div className="flex flex-col gap-1">
            <span className="font-semibold">{ticket.name}</span>
            {ticket.description ? (
              <span className="text-xs text-muted-foreground line-clamp-1">
                {ticket.description}
              </span>
            ) : null}
          </div>
        ),
      },
      {
        key: 'event',
        header: 'Événement',
        cell: (ticket) => (
          <div className="flex flex-col gap-1">
            <span>{ticket.event?.title ?? '—'}</span>
            {ticket.event?.date ? (
              <span className="text-xs text-muted-foreground">
                {new Date(ticket.event.date).toLocaleDateString('fr-FR')}
              </span>
            ) : null}
          </div>
        ),
      },
      {
        key: 'race',
        header: 'Format',
        cell: (ticket) =>
          ticket.race ? (
            <div className="flex flex-col gap-1">
              <span>{ticket.race.name}</span>
              <span className="text-xs text-muted-foreground">
                {ticket.race.distance_km ? `${ticket.race.distance_km} km • ` : ''}
                Difficulté {ticket.race.difficulty}/10
              </span>
            </div>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        key: 'pricing',
        header: 'Tarif & quotas',
        cell: (ticket) => (
          <div className="flex flex-col">
            <span>{formatPrice(ticket.base_price_cents, ticket.currency)}</span>
            <span className="text-xs text-muted-foreground">
              Max {ticket.max_participants || '∞'} participant{ticket.max_participants > 1 ? 's' : ''}
            </span>
          </div>
        ),
      },
      {
        key: 'documents',
        header: 'Documents',
        cell: (ticket) => (
          <div className="flex flex-wrap gap-1.5">
            <Badge variant={ticket.requires_document ? 'default' : 'secondary'}>
              {ticket.requires_document ? 'Document requis' : 'Aucun document'}
            </Badge>
            {ticket.document_types && ticket.document_types.length > 0
              ? ticket.document_types.map((type) => (
                  <Badge key={type} variant="outline" className="text-xs capitalize">
                    {type.replace('_', ' ')}
                  </Badge>
                ))
              : null}
          </div>
        ),
      },
      {
        key: 'actions',
        header: '',
        className: 'w-[180px]',
        cell: (ticket) => (
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => handleEdit(ticket)}>
              Modifier
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleDelete(ticket)}
              disabled={deleteLoadingId === ticket.id}
            >
              {deleteLoadingId === ticket.id ? 'Suppression…' : 'Supprimer'}
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
          <h2 className="text-2xl font-bold">Gestion des billets</h2>
          <p className="text-muted-foreground">
            Paramètre les billets, leurs tarifs et les documents nécessaires.
          </p>
        </div>
        <Button onClick={handleCreateClick}>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau ticket
        </Button>
      </div>

      {message && (
        <Alert variant={alertVariant}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {combinedError ? (
        <Alert variant="destructive">
          <AlertDescription>
            {(combinedError as Error).message || 'Impossible de charger les tickets'}
          </AlertDescription>
        </Alert>
      ) : null}

      <AdminDataGrid
        data={filteredTickets}
        columns={columns}
        loading={combinedLoading}
        emptyMessage={
          searchTerm || eventFilter !== 'all'
            ? 'Aucun ticket ne correspond aux filtres appliqués.'
            : 'Aucun ticket disponible. Crée un ticket pour proposer une inscription.'
        }
        toolbar={
          <div className="grid gap-3 md:grid-cols-3">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Rechercher par nom, événement ou format…"
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={eventFilter} onValueChange={setEventFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Événement" />
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
        }
        meta={
          <span>
            {filteredTickets.length} ticket{filteredTickets.length > 1 ? 's' : ''} affiché
          </span>
        }
        getRowId={(ticket) => ticket.id}
      />

      <TicketFormDialog
        open={dialogOpen}
        mode={dialogMode}
        initialValues={formValues}
        loading={submitting}
        events={events}
        races={races}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
      />
    </div>
  )
}

