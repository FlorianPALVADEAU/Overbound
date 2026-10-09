'use client'

import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEventParticipants, type EventParticipantCheckInFilter, type EventParticipantSort, type EventParticipantRow } from '@/app/api/admin/events/participantsQueries'
import { TicketChangePreviewPanel } from './TicketChangePreviewPanel'
import { WaveChangePreviewPanel } from './WaveChangePreviewPanel'
import {
  getParticipantQuickActionState,
  type ParticipantPreviewAction,
} from './participantQuickActions'
import {
  parseParticipantUrlState,
  writeParticipantUrlState,
} from './participantUrlState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  OperationsList,
  type OperationsListAction,
  type OperationsListColumn,
  type OperationsListFilter,
} from '@/components/admin/operations'

interface EventParticipantsListProps {
  eventId: string
}

const formatDate = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
    : '—'

const formatAmount = (amount: number | null, currency: string | null) => {
  if (amount === null) return '—'
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency?.toUpperCase() ?? 'EUR',
  }).format(amount / 100)
}

export function EventParticipantsList({ eventId }: EventParticipantsListProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const initialUrlState = useMemo(() => parseParticipantUrlState(searchParams, eventId), [eventId, searchParams])
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search.trim())
  const [checkIn, setCheckIn] = useState<EventParticipantCheckInFilter>(initialUrlState.checkIn)
  const [sort, setSort] = useState<EventParticipantSort>(initialUrlState.sort)
  const [direction, setDirection] = useState<'asc' | 'desc'>(initialUrlState.direction)
  const [limit, setLimit] = useState(initialUrlState.limit)
  const [cursor, setCursor] = useState<string | null>(initialUrlState.cursor)
  const [previousCursors, setPreviousCursors] = useState<string[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [selectedParticipant, setSelectedParticipant] = useState<EventParticipantRow | null>(null)
  const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(initialUrlState.selectedId)
  const [selectedPreview, setSelectedPreview] = useState<ParticipantPreviewAction>('ticket')
  const hasInitializedSearch = useRef(false)

  useEffect(() => {
    if (!hasInitializedSearch.current) {
      hasInitializedSearch.current = true
      return
    }
    setCursor(null)
    setPreviousCursors([])
  }, [deferredSearch])

  const resetPagination = () => {
    setCursor(null)
    setPreviousCursors([])
  }

  const changeCheckIn = (value: string) => {
    resetPagination()
    setCheckIn(value as EventParticipantCheckInFilter)
  }

  const changeSort = (value: string) => {
    resetPagination()
    setSort(value as EventParticipantSort)
  }

  const changeLimit = (value: string) => {
    resetPagination()
    setLimit(Number(value))
  }

  // Keep browser back/forward and copied links authoritative without putting
  // the free-text search (which may contain PII) into the URL.
  useEffect(() => {
    const next = parseParticipantUrlState(searchParams, eventId)
    setCheckIn((current) => current === next.checkIn ? current : next.checkIn)
    setSort((current) => current === next.sort ? current : next.sort)
    setDirection((current) => current === next.direction ? current : next.direction)
    setLimit((current) => current === next.limit ? current : next.limit)
    setCursor((current) => current === next.cursor ? current : next.cursor)
    setSelectedParticipantId((current) => current === next.selectedId ? current : next.selectedId)
    setPreviousCursors([])
  }, [eventId, searchParams])

  useEffect(() => {
    const next = writeParticipantUrlState(searchParams, { checkIn, sort, direction, cursor, limit, selectedId: selectedParticipantId })
    const current = searchParams.toString()
    if (next === current) return
    router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false })
  }, [checkIn, cursor, direction, limit, pathname, router, searchParams, selectedParticipantId, sort])

  const params = useMemo(
    () => ({ eventId, cursor, direction, limit, query: deferredSearch || undefined, checkIn, sort }),
    [checkIn, cursor, deferredSearch, direction, eventId, limit, sort],
  )
  const { data, error, isLoading, isFetching } = useEventParticipants(params)
  const participants = data?.participants ?? []
  const page = data?.page

  useEffect(() => {
    if (!selectedParticipantId) {
      setSelectedParticipant(null)
      return
    }
    const matchingParticipant = participants.find((participant) => participant.id === selectedParticipantId)
    // A filter, sort or page change can make the previously opened row leave
    // the current result set. Never keep showing its detail panel with stale
    // data; the URL selection remains available if the row comes back.
    setSelectedParticipant(matchingParticipant ?? null)
  }, [participants, selectedParticipantId])

  const openParticipant = (participant: EventParticipantRow, preview: ParticipantPreviewAction = 'ticket') => {
    setSelectedParticipant(participant)
    setSelectedParticipantId(participant.id)
    setSelectedPreview(preview)
  }

  const filters: OperationsListFilter[] = [
    {
      id: 'check-in',
      label: 'Check-in',
      value: checkIn === 'all' ? '' : checkIn,
      allLabel: 'Tous les statuts',
      options: [
        { value: 'checked_in', label: 'Effectué' },
        { value: 'not_checked_in', label: 'À faire' },
      ],
    },
    {
      id: 'sort',
      label: 'Trier par',
      value: sort,
      options: [
        { value: 'created_at', label: 'Date d’inscription' },
        { value: 'email', label: 'Email' },
      ],
    },
    {
      id: 'direction',
      label: 'Ordre',
      value: direction,
      options: [
        { value: 'desc', label: 'Décroissant' },
        { value: 'asc', label: 'Croissant' },
      ],
    },
    {
      id: 'limit',
      label: 'Lignes',
      value: String(limit),
      options: [25, 50, 100].map((value) => ({ value: String(value), label: String(value) })),
    },
  ]

  const columns: OperationsListColumn<EventParticipantRow>[] = [
    {
      id: 'participant',
      header: 'Participant',
      cell: (participant) => <><p className="font-medium">{participant.participant.name ?? 'Nom non renseigné'}</p><p className="truncate text-xs text-muted-foreground">{participant.participant.email}</p></>,
    },
    {
      id: 'status',
      header: 'Statut',
      cell: (participant) => <div className="flex flex-wrap gap-1">{participant.registration.cancelledAt ? <Badge variant="destructive" title={`Annulé et remboursé le ${new Date(participant.registration.cancelledAt).toLocaleDateString('fr-FR')}`}>Annulé · remboursé</Badge> : <Badge variant={participant.registration.checkedIn ? 'default' : 'secondary'}>{participant.registration.checkedIn ? 'Check-in' : 'À venir'}</Badge>}<Badge variant="outline">{participant.participant.accountStatus === 'claimed' ? 'Compte lié' : 'Invité'}</Badge></div>,
    },
    {
      id: 'ticket',
      header: 'Billet',
      cell: (participant) => <><p>{participant.ticket.name ?? '—'}</p><p className="truncate text-xs text-muted-foreground">{participant.ticket.operations.status === 'unconfigured' ? 'Règles à configurer' : participant.ticket.operations.departureMode === 'wave' ? 'Départ par SAS' : participant.ticket.operations.departureMode === 'fixed' ? 'Départ fixe' : 'Aucun départ géré'}</p></>,
    },
    {
      id: 'departure',
      header: 'Départ',
      cell: (participant) => participant.departure.startTime ? <><p>{formatDate(participant.departure.startTime)}</p><p className="text-xs text-muted-foreground">SAS {participant.departure.waveIndex ?? '—'}</p></> : '—',
      hiddenByDefault: true,
    },
    { id: 'group', header: 'Groupe', cell: (participant) => participant.group ?? '—', hiddenByDefault: true },
    {
      id: 'payment',
      header: 'Paiement',
      cell: (participant) => participant.payment ? <><p>{participant.payment.status ?? '—'}</p><p className="text-xs text-muted-foreground">{formatAmount(participant.payment.amountCents, participant.payment.currency)}</p></> : '—',
      hiddenByDefault: true,
    },
    { id: 'created-at', header: 'Inscrit le', cell: (participant) => formatDate(participant.registration.createdAt), hiddenByDefault: true },
  ]

  const rowActions: OperationsListAction<EventParticipantRow>[] = [
    {
      id: 'change-ticket',
      label: 'Changer le billet',
      onSelect: (participant) => openParticipant(participant, 'ticket'),
      disabled: (participant) => getParticipantQuickActionState(participant).ticket.disabled,
    },
    {
      id: 'change-wave',
      label: 'Changer la SAS',
      onSelect: (participant) => openParticipant(participant, 'wave'),
      disabled: (participant) => getParticipantQuickActionState(participant).wave.disabled,
    },
  ]

  return (
    <OperationsList
      data={{ items: participants, nextCursor: page?.nextCursor ?? null, total: page?.totalCount }}
      status={error ? 'error' : isLoading && !data ? 'loading' : isFetching ? 'stale' : 'idle'}
      errorMessage={error?.message}
      onRetry={() => window.location.reload()}
      getItemId={(participant) => participant.id}
      columns={columns}
      filters={filters}
      onFilterChange={(filterId, value) => {
        resetPagination()
        if (filterId === 'check-in') changeCheckIn(value || 'all')
        if (filterId === 'sort') changeSort(value as EventParticipantSort)
        if (filterId === 'direction') setDirection(value as 'asc' | 'desc')
        if (filterId === 'limit') changeLimit(value)
      }}
      search={search}
      searchPlaceholder="Nom, email ou identifiant"
      onSearchChange={setSearch}
      selectedIds={selectedIds}
      onSelectedIdsChange={setSelectedIds}
      rowActions={rowActions}
      pagination={{ cursor, previousCursors, nextCursor: page?.nextCursor ?? null, total: page?.totalCount }}
      onPaginationChange={({ cursor: nextCursor, previousCursors: nextPreviousCursors }) => {
        setCursor(nextCursor)
        setPreviousCursors(nextPreviousCursors)
      }}
      itemLabel="participant"
      selectedItem={selectedParticipant}
      onSelectedItemChange={(participant) => {
        setSelectedParticipant(participant)
        setSelectedParticipantId(participant?.id ?? null)
      }}
      detailTitle={(participant) => participant.participant.name ?? 'Participant'}
      detailDescription={() => 'Consultez l’inscription et prévisualisez une correction avant de la confirmer.'}
      renderDetail={(participant) => {
        const actions = getParticipantQuickActionState(participant)
        return <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/20 p-3" aria-label="Actions participant">
            <span className="mr-1 text-sm font-medium">Prévisualiser</span>
            <Button type="button" size="sm" variant={selectedPreview === 'ticket' ? 'secondary' : 'outline'} onClick={() => setSelectedPreview('ticket')} disabled={actions.ticket.disabled}>Changement de billet</Button>
            <Button type="button" size="sm" variant={selectedPreview === 'wave' ? 'secondary' : 'outline'} onClick={() => setSelectedPreview('wave')} disabled={actions.wave.disabled}>Changement de SAS</Button>
            {actions.wave.disabled ? <span className="text-xs text-muted-foreground">{actions.wave.reason}</span> : null}
          </div>
          <div className="grid gap-4 text-sm sm:grid-cols-2">
            <div><p className="text-muted-foreground">Email</p><p className="break-all">{participant.participant.email}</p></div>
            <div><p className="text-muted-foreground">Inscription</p><p className="font-mono text-xs break-all">{participant.id}</p></div>
            <div><p className="text-muted-foreground">Billet</p><p>{participant.ticket.name ?? '—'}</p></div>
            <div><p className="text-muted-foreground">Départ</p><p>{participant.departure.startTime ? `${formatDate(participant.departure.startTime)} · SAS ${participant.departure.waveIndex ?? '—'}` : '—'}</p></div>
            <div><p className="text-muted-foreground">Groupe</p><p>{participant.group ?? 'Aucun'}</p></div>
            <div><p className="text-muted-foreground">Paiement</p><p>{participant.payment ? `${participant.payment.status ?? '—'} · ${formatAmount(participant.payment.amountCents, participant.payment.currency)}` : '—'}</p></div>
          </div>
          {selectedPreview === 'ticket' ? <TicketChangePreviewPanel eventId={eventId} participant={participant} /> : null}
          {selectedPreview === 'wave' ? <WaveChangePreviewPanel eventId={eventId} participant={participant} /> : null}
        </div>
      }}
    />
  )
}
