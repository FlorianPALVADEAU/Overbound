'use client'

import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { DeleteConfirmationDialog } from '@/components/admin/ui/DeleteConfirmationDialog'
import type { Ticket } from '@/types/Ticket'
import { companionConfigFromForm, companionFormFromConfig, emptyCompanionForm } from '@/lib/tickets/openCompanionAdmin'
import { parseOpenCompanionConfig } from '@/lib/tickets/openCompanion'
import { TicketFormDialog, type TicketFormValues } from './TicketFormDialog'
import { EventWavesSection } from '@/components/admin/events/EventOpenWavesSection'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  adminTicketsQueryKey,
  createAdminTicket,
  deleteAdminTicket,
  updateAdminTicket,
  useAdminTickets,
  useAdminTicketsPage,
  type AdminTicketPayload,
} from '@/app/api/admin/tickets/ticketsQueries'
import { useAdminEvents } from '@/app/api/admin/events/eventsQueries'
import { useAdminRaces } from '@/app/api/admin/races/racesQueries'
import {
  OperationsList,
  parseOperationsListUrlState,
  writeOperationsListUrlState,
  type OperationsListAction,
  type OperationsListColumn,
  type OperationsListFilter,
} from '@/components/admin/operations'

interface MessageState {
  type: 'success' | 'error'
  text: string
}

const toLocalDateTimeInput = (value: unknown): string => {
  if (typeof value !== 'string' || !value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const offsetMs = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16)
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
      departure_mode: 'none',
      departure_change_policy: 'preserve',
      fixed_start_time: '',
      companion: emptyCompanionForm(),
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
    requires_document: false,
    document_types: [],
    departure_mode: ticket.operations_config?.departure_mode ?? 'none',
    departure_change_policy: ticket.operations_config?.departure_change_policy ?? 'preserve',
    fixed_start_time: toLocalDateTimeInput(ticket.operations_config?.fixed_start_time),
    companion: companionFormFromConfig(ticket.operations_config),
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

/** Shows the "Option OPEN" of a ticket, so a missing or broken one is visible in the list. */
function CompanionBadge({ ticket, tickets }: { ticket: Ticket; tickets: Ticket[] }) {
  const companion = parseOpenCompanionConfig(ticket.operations_config)
  if (!companion) return null
  const target = tickets.find((candidate) => candidate.id === companion.openTicketId)
  if (!target) {
    return <span className="text-xs text-destructive">Option OPEN : billet OPEN introuvable</span>
  }
  return (
    <span className="text-xs text-primary">
      Option OPEN {formatPrice(companion.priceCents, ticket.currency)} : {target.name}
    </span>
  )
}

const TICKET_SORTS = new Set(['created_at', 'name', 'final_price_cents'])

export function TicketsSection() {
  const router = useRouter()
  const pathname = usePathname()
  const routeParams = useParams<{ eventId?: string }>()
  const searchParams = useSearchParams()
  // Standalone ticket routes keep the event context in `?event=...`; nested
  // event routes keep it in the pathname. Supporting both prevents the
  // sidebar context from being silently ignored on `/dashboard/tickets`.
  const scopedEventId = routeParams?.eventId ?? searchParams.get('event') ?? undefined
  const queryClient = useQueryClient()
  const initialUrlState = useMemo(
    () => parseOperationsListUrlState(searchParams, { filterIds: ['event'], allowedLimits: new Set([25, 50, 100]) }),
    [searchParams],
  )
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
  const [eventFilter, setEventFilter] = useState<string>(initialUrlState.filters.event ?? '')
  const [searchTerm, setSearchTerm] = useState('')
  const deferredSearch = useDeferredValue(searchTerm.trim())
  const [sort, setSort] = useState<'created_at' | 'name' | 'final_price_cents'>(
    initialUrlState.sort === 'name' || initialUrlState.sort === 'final_price_cents' ? initialUrlState.sort : 'created_at',
  )
  const [direction, setDirection] = useState<'asc' | 'desc'>(initialUrlState.direction ?? 'desc')
  const [limit, setLimit] = useState(initialUrlState.limit as 25 | 50 | 100)
  const [cursor, setCursor] = useState<string | null>(initialUrlState.cursor)
  const [previousCursors, setPreviousCursors] = useState<string[]>([])

  // Delete confirmation dialog state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [ticketToDelete, setTicketToDelete] = useState<Ticket | null>(null)
  const [waveTicket, setWaveTicket] = useState<Ticket | null>(null)

  const activeEventFilter = scopedEventId ?? (eventFilter || undefined)
  const {
    data: ticketsPage,
    isLoading: ticketsLoading,
    isFetching: ticketsFetching,
    error: ticketsError,
    refetch: refetchTickets,
  } = useAdminTicketsPage({ cursor, limit, query: deferredSearch || undefined, eventId: activeEventFilter, sort, direction })
  const tickets = ticketsPage?.tickets ?? []
  // Whole catalogue, not the visible page: the OPEN ticket of an option may sit on another page.
  const { data: allTickets = [] } = useAdminTickets()
  const combinedLoading = ticketsLoading || eventsLoading || racesLoading
  const combinedError = ticketsError || eventsError || racesError

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
      sort,
      direction,
      limit,
      selectedId: null,
      filters: { event: scopedEventId ? '' : eventFilter || '' },
    }, { filterIds: ['event'] })
    const current = searchParams.toString()
    if (next !== current) router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false })
  }, [cursor, direction, eventFilter, limit, pathname, router, scopedEventId, searchParams, sort])

  useEffect(() => {
    const next = parseOperationsListUrlState(searchParams, { filterIds: ['event'], allowedLimits: new Set([25, 50, 100]) })
    const nextSort = TICKET_SORTS.has(next.sort ?? '')
      ? (next.sort as typeof sort)
      : 'created_at'
    const nextDirection = next.direction ?? 'desc'
    const nextEventFilter = scopedEventId ? eventFilter : next.filters.event ?? ''
    const hasExternalStateChange = eventFilter !== nextEventFilter
      || sort !== nextSort
      || direction !== nextDirection
      || limit !== next.limit
      || cursor !== next.cursor
    setEventFilter((current) => current === nextEventFilter ? current : nextEventFilter)
    setSort((current) => current === nextSort ? current : nextSort)
    setDirection((current) => current === nextDirection ? current : nextDirection)
    setLimit((current) => current === next.limit ? current : next.limit as typeof limit)
    setCursor((current) => current === next.cursor ? current : next.cursor)
    if (hasExternalStateChange) setPreviousCursors([])
    // State is intentionally read here to distinguish browser navigation from
    // the URL update emitted by the preceding effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scopedEventId, searchParams])

  const handleCreateClick = () => {
    setMessage(null)
    setDialogMode('create')
    setSelectedTicket(null)
    setFormValues(buildFormValues())
    setDialogOpen(true)
  }

  const handleEdit = (ticket: Ticket) => {
    setMessage(null)
    setDialogMode('edit')
    setSelectedTicket(ticket)
    setFormValues(buildFormValues(ticket))
    setDialogOpen(true)
  }

  const handleDeleteClick = (ticket: Ticket) => {
    setTicketToDelete(ticket)
    setDeleteConfirmOpen(true)
  }

  const handleDelete = async () => {
    if (!ticketToDelete) return

    setDeleteLoadingId(ticketToDelete.id)
    try {
      // The server refuses a ticket that still has registrations (409): nothing is forced from here.
      await deleteAdminTicket(ticketToDelete.id)
      queryClient.setQueryData<Ticket[]>(adminTicketsQueryKey, (previous) => {
        if (!previous) return []
        return previous.filter((item) => item.id !== ticketToDelete.id)
      })
      setMessage({ type: 'success', text: 'Ticket supprimé avec succès' })
      await queryClient.invalidateQueries({ queryKey: adminTicketsQueryKey })
    } catch (error) {
      const text = axios.isAxiosError(error)
        ? error.response?.data?.error || error.message
        : (error as Error).message || 'Erreur lors de la suppression'
      setMessage({ type: 'error', text })
    } finally {
      setDeleteLoadingId(null)
      setDeleteConfirmOpen(false)
      setTicketToDelete(null)
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

    // A SAS ticket is the target of an option, never its carrier.
    const companion = companionConfigFromForm(
      values.departure_mode === 'wave' ? { ...values.companion, enabled: false } : values.companion,
    )
    if (!companion.ok) {
      setMessage({ type: 'error', text: companion.error })
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
      requires_document: false,
      document_types: [],
      operations_config: {
        profile_key: 'ticket-default-v1',
        departure_mode: values.departure_mode,
        departure_change_policy: values.departure_change_policy,
        fixed_start_time: values.departure_mode === 'fixed' && values.fixed_start_time
          ? new Date(values.fixed_start_time).toISOString()
          : null,
        ...(companion.config ? { open_companion: companion.config } : {}),
      },
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

  const columns: OperationsListColumn<Ticket>[] = [
      {
        id: 'ticket',
        header: 'Ticket',
        cell: (ticket) => (
          <div className="flex flex-col gap-1">
              <span className="truncate font-semibold" title={ticket.name}>{ticket.name}</span>
            {ticket.description ? (
              <span className="line-clamp-1 max-w-[22rem] text-xs text-muted-foreground" title={ticket.description}>
                {ticket.description}
              </span>
            ) : null}
          </div>
        ),
      },
      {
        id: 'event',
        header: 'Événement',
        cell: (ticket) => (
          <div className="flex flex-col gap-1">
            <span className="truncate" title={ticket.event?.title ?? undefined}>{ticket.event?.title ?? '—'}</span>
            {ticket.event?.date ? (
              <span className="text-xs text-muted-foreground">
                {new Date(ticket.event.date).toLocaleDateString('fr-FR')}
              </span>
            ) : null}
          </div>
        ),
      },
      {
        id: 'race',
        header: 'Format',
        cell: (ticket) =>
          ticket.race ? (
            <div className="flex flex-col gap-1">
                <span className="truncate" title={ticket.race.name}>{ticket.race.name}</span>
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
        id: 'pricing',
        header: 'Tarif & quotas',
        cell: (ticket) => (
          <div className="flex flex-col">
            <span>{formatPrice(ticket.final_price_cents, ticket.currency)}</span>
            <span className="text-xs text-muted-foreground">
              Max {ticket.max_participants || '∞'} participant{ticket.max_participants > 1 ? 's' : ''}
            </span>
            <CompanionBadge ticket={ticket} tickets={allTickets} />
          </div>
        ),
      },
  ]

  const filters: OperationsListFilter[] = [
    ...(!scopedEventId ? [{ id: 'event', label: 'Événement', value: eventFilter, allLabel: 'Tous les événements', options: events.map((event) => ({ value: event.id, label: event.title })) }] : []),
    { id: 'sort', label: 'Trier par', value: sort, options: [{ value: 'created_at', label: 'Date de création' }, { value: 'name', label: 'Nom' }, { value: 'final_price_cents', label: 'Tarif' }] },
    { id: 'direction', label: 'Ordre', value: direction, options: [{ value: 'desc', label: 'Décroissant' }, { value: 'asc', label: 'Croissant' }] },
    { id: 'limit', label: 'Lignes', value: String(limit), options: [25, 50, 100].map((value) => ({ value: String(value), label: String(value) })) },
  ]

  const rowActions: OperationsListAction<Ticket>[] = [
    { id: 'waves', label: 'Gérer les SAS', onSelect: setWaveTicket, disabled: (ticket) => ticket.operations_config?.departure_mode !== 'wave' },
    { id: 'edit', label: 'Modifier', onSelect: handleEdit },
    { id: 'delete', label: 'Supprimer', destructive: true, onSelect: handleDeleteClick, disabled: (ticket) => deleteLoadingId === ticket.id },
  ]

  const alertVariant = message?.type === 'error' ? 'destructive' : 'default'

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Billetterie"
        title="Gestion des billets"
        description="Paramètre les billets, leurs tarifs et leurs quotas."
        actions={
          <Button onClick={handleCreateClick}>
            <Plus className="mr-2 h-4 w-4" />
            Nouveau ticket
          </Button>
        }
      />

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

      <OperationsList
        data={{ items: tickets, nextCursor: ticketsPage?.page.nextCursor ?? null, total: ticketsPage?.page.totalCount }}
        status={combinedError ? 'error' : combinedLoading && !ticketsPage ? 'loading' : ticketsFetching ? 'stale' : 'idle'}
        errorMessage={(combinedError as Error | null)?.message}
        onRetry={() => { void refetchTickets() }}
        getItemId={(ticket) => ticket.id}
        columns={columns}
        filters={filters}
        onFilterChange={(filterId, value) => {
          resetPagination()
          if (filterId === 'event' && !scopedEventId) setEventFilter(value)
          if (filterId === 'sort') setSort(value as typeof sort)
          if (filterId === 'direction') setDirection(value as typeof direction)
          if (filterId === 'limit') setLimit(Number(value) as typeof limit)
        }}
        search={searchTerm}
        searchPlaceholder="Rechercher par nom ou description…"
        onSearchChange={setSearchTerm}
        rowActions={rowActions}
        pagination={{ cursor, previousCursors, nextCursor: ticketsPage?.page.nextCursor ?? null, total: ticketsPage?.page.totalCount, limit }}
        onPaginationChange={({ cursor: nextCursor, previousCursors: nextPreviousCursors }) => { setCursor(nextCursor); setPreviousCursors(nextPreviousCursors) }}
        itemLabel="ticket"
      />

      <Dialog open={Boolean(waveTicket)} onOpenChange={(open) => { if (!open) setWaveTicket(null) }}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-[min(72rem,calc(100vw-2rem))] overflow-x-hidden overflow-y-auto p-4 sm:p-6 max-h-[calc(100dvh-2rem)]">
          <DialogHeader>
            <DialogTitle>Gérer les SAS du billet</DialogTitle>
            <DialogDescription>
              Chaque billet possède sa propre grille de départs, ses capacités et ses inscrits.
            </DialogDescription>
          </DialogHeader>
          {waveTicket ? (
            <EventWavesSection
              eventId={waveTicket.event_id}
              ticketId={waveTicket.id}
              ticketName={waveTicket.name}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <TicketFormDialog
        open={dialogOpen}
        mode={dialogMode}
        initialValues={formValues}
        loading={submitting}
        error={dialogOpen && message?.type === 'error' ? message.text : null}
        events={events}
        races={races}
        tickets={allTickets}
        editingTicketId={selectedTicket?.id}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
      />

      <DeleteConfirmationDialog
        open={deleteConfirmOpen}
        onOpenChange={(open) => {
          setDeleteConfirmOpen(open)
          if (!open) {
            setTicketToDelete(null)
          }
        }}
        title="Supprimer le ticket"
        entityName={ticketToDelete?.name ?? ''}
        entityType="le ticket"
        onConfirm={handleDelete}
        loading={deleteLoadingId === ticketToDelete?.id}
      />
    </div>
  )
}
