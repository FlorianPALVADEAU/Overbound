'use client'

import { useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Search, AlertTriangle } from 'lucide-react'
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
    }
  }

  return {
    event_id: ticket.event_id,
    race_id: ticket.race?.id || 'none',
    name: ticket.name,
    description: ticket.description || '',
    price: ticket.final_price_cents.toString(),
    currency: ticket.currency || 'eur',
    max_participants: ticket.max_participants.toString(),
    requires_document: ticket.requires_document,
    document_types: ticket.document_types || [],
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

  // Delete confirmation dialog state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [ticketToDelete, setTicketToDelete] = useState<Ticket | null>(null)
  const [registrationCount, setRegistrationCount] = useState<number>(0)

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

  const handleDeleteClick = (ticket: Ticket) => {
    setTicketToDelete(ticket)
    setRegistrationCount(0)
    setDeleteConfirmOpen(true)
  }

  const handleDelete = async (force = false) => {
    if (!ticketToDelete) return

    setDeleteLoadingId(ticketToDelete.id)
    try {
      await deleteAdminTicket(ticketToDelete.id, force)
      queryClient.setQueryData<Ticket[]>(adminTicketsQueryKey, (previous) => {
        if (!previous) return []
        return previous.filter((item) => item.id !== ticketToDelete.id)
      })
      setMessage({
        type: 'success',
        text: force
          ? `Ticket et ${registrationCount} inscription(s) supprimés avec succès`
          : 'Ticket supprimé avec succès'
      })
      setDeleteConfirmOpen(false)
      setTicketToDelete(null)
      setRegistrationCount(0)
    } catch (error) {
      const err = error as Error & { registrationCount?: number; requiresConfirmation?: boolean }
      if (err.requiresConfirmation && err.registrationCount) {
        // Show the count and keep the dialog open for force confirmation
        setRegistrationCount(err.registrationCount)
      } else {
        const text = axios.isAxiosError(error)
          ? error.response?.data?.error || error.message
          : err.message || 'Erreur lors de la suppression'
        setMessage({ type: 'error', text })
        setDeleteConfirmOpen(false)
        setTicketToDelete(null)
      }
    } finally {
      setDeleteLoadingId(null)
    }
  }

  const handleSubmit = async (values: TicketFormValues) => {
    if (!values.name || !values.event_id) {
      setMessage({ type: 'error', text: 'Veuillez remplir les champs obligatoires' })
      return
    }

    if (!values.price) {
      setMessage({ type: 'error', text: 'Le prix est requis' })
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
      } else if (selectedTicket) {
        const updated = await updateAdminTicket(selectedTicket.id, payload)
        queryClient.setQueryData<Ticket[]>(adminTicketsQueryKey, (previous) => {
          if (!previous) return [updated]
          return previous.map((item) => (item.id === selectedTicket.id ? updated : item))
        })
      } else {
        throw new Error('No ticket selected for update')
      }

      // Refresh tickets data
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
            <span>{formatPrice(ticket.final_price_cents, ticket.currency)}</span>
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
              onClick={() => handleDeleteClick(ticket)}
              disabled={deleteLoadingId === ticket.id}
            >
              {deleteLoadingId === ticket.id ? 'Suppression…' : 'Supprimer'}
            </Button>
          </div>
        ),
      },
    ]
  }, [deleteLoadingId, handleDeleteClick])

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

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {registrationCount > 0 && <AlertTriangle className="h-5 w-5 text-destructive" />}
              Supprimer le ticket
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              {registrationCount > 0 ? (
                <>
                  <p className="text-destructive font-medium">
                    Attention : ce ticket a {registrationCount} inscription{registrationCount > 1 ? 's' : ''} active{registrationCount > 1 ? 's' : ''}.
                  </p>
                  <p>
                    En confirmant la suppression, vous allez supprimer définitivement le ticket
                    <strong> &quot;{ticketToDelete?.name}&quot;</strong> ainsi que toutes les inscriptions associées.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Cette action est irréversible. Les participants concernés perdront leur inscription.
                  </p>
                </>
              ) : (
                <p>
                  Êtes-vous sûr de vouloir supprimer le ticket <strong>&quot;{ticketToDelete?.name}&quot;</strong> ?
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setTicketToDelete(null)
                setRegistrationCount(0)
              }}
            >
              Annuler
            </AlertDialogCancel>
            {registrationCount > 0 ? (
              <AlertDialogAction
                onClick={() => handleDelete(true)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={deleteLoadingId === ticketToDelete?.id}
              >
                {deleteLoadingId === ticketToDelete?.id
                  ? 'Suppression…'
                  : `Supprimer le ticket et ${registrationCount} inscription${registrationCount > 1 ? 's' : ''}`}
              </AlertDialogAction>
            ) : (
              <AlertDialogAction
                onClick={() => handleDelete(false)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={deleteLoadingId === ticketToDelete?.id}
              >
                {deleteLoadingId === ticketToDelete?.id ? 'Suppression…' : 'Supprimer'}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

