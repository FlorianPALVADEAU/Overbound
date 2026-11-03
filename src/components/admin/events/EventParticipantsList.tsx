'use client'

import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  participantsExportUrl,
  useEventParticipantOptions,
  useEventParticipants,
  useResendTicket,
  type EventParticipantCheckInFilter,
  type EventParticipantRow,
  type EventParticipantSort,
  type EventParticipantStatusFilter,
} from '@/app/api/admin/events/participantsQueries'
import { CancelRegistrationDialog } from './CancelRegistrationDialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Download, RefreshCw } from 'lucide-react'
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
import { orderStatusLabel } from '@/lib/admin/ordersList'
import { RefundedBadge } from '@/components/admin/ui/RefundedBadge'
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

const formatClock = (value: string) =>
  new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' }).format(new Date(value))

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
  const [status, setStatus] = useState<EventParticipantStatusFilter>(initialUrlState.status)
  const [ticketId, setTicketId] = useState<string | null>(initialUrlState.ticketId)
  const [wave, setWave] = useState<string | null>(initialUrlState.wave)
  const [sort, setSort] = useState<EventParticipantSort>(initialUrlState.sort)
  const [direction, setDirection] = useState<'asc' | 'desc'>(initialUrlState.direction)
  const [limit, setLimit] = useState(initialUrlState.limit)
  const [cursor, setCursor] = useState<string | null>(initialUrlState.cursor)
  const [previousCursors, setPreviousCursors] = useState<string[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [selectedParticipant, setSelectedParticipant] = useState<EventParticipantRow | null>(null)
  const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(initialUrlState.selectedId)
  const [selectedPreview, setSelectedPreview] = useState<ParticipantPreviewAction>('ticket')
  const [cancelTarget, setCancelTarget] = useState<EventParticipantRow | null>(null)
  const [notice, setNotice] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)
  const resendTicket = useResendTicket()
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

  const changeStatus = (value: string) => {
    resetPagination()
    setStatus(value as EventParticipantStatusFilter)
  }

  const changeTicket = (value: string) => {
    resetPagination()
    setTicketId(value || null)
  }

  const changeWave = (value: string) => {
    resetPagination()
    setWave(value || null)
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
    setStatus((current) => current === next.status ? current : next.status)
    setTicketId((current) => current === next.ticketId ? current : next.ticketId)
    setWave((current) => current === next.wave ? current : next.wave)
    setSort((current) => current === next.sort ? current : next.sort)
    setDirection((current) => current === next.direction ? current : next.direction)
    setLimit((current) => current === next.limit ? current : next.limit)
    setCursor((current) => current === next.cursor ? current : next.cursor)
    setSelectedParticipantId((current) => current === next.selectedId ? current : next.selectedId)
    setPreviousCursors([])
  }, [eventId, searchParams])

  useEffect(() => {
    const next = writeParticipantUrlState(searchParams, { checkIn, status, ticketId, wave, sort, direction, cursor, limit, selectedId: selectedParticipantId })
    const current = searchParams.toString()
    if (next === current) return
    router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false })
  }, [checkIn, cursor, direction, limit, pathname, router, searchParams, selectedParticipantId, sort, status, ticketId, wave])

  const params = useMemo(
    () => ({ eventId, cursor, direction, limit, query: deferredSearch || undefined, checkIn, status, ticketId, wave, sort }),
    [checkIn, cursor, deferredSearch, direction, eventId, limit, sort, status, ticketId, wave],
  )
  const { data, error, isLoading, isFetching, refetch } = useEventParticipants(params)
  const { data: options } = useEventParticipantOptions(eventId)
  const participants = useMemo(() => data?.participants ?? [], [data])
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
      allLabel: 'Tous les check-ins',
      options: [
        { value: 'checked_in', label: 'Effectué' },
        { value: 'not_checked_in', label: 'À faire' },
      ],
    },
    {
      id: 'status',
      label: 'Statut',
      value: status === 'all' ? '' : status,
      allLabel: 'Actives et annulées',
      options: [
        { value: 'active', label: 'Actives' },
        { value: 'cancelled', label: 'Annulées' },
      ],
    },
    {
      id: 'ticket',
      label: 'Billet',
      value: ticketId ?? '',
      allLabel: 'Tous les billets',
      options: (options?.tickets ?? []).map((ticket) => ({ value: ticket.id, label: ticket.name })),
    },
    {
      id: 'wave',
      label: 'SAS',
      value: wave ?? '',
      allLabel: 'Tous les SAS',
      options: [
        { value: 'none', label: 'Sans SAS' },
        ...(options?.waves ?? []).map((item) => ({
          value: String(item.waveIndex),
          label: item.startTime ? `SAS ${item.waveIndex} · ${formatClock(item.startTime)}` : `SAS ${item.waveIndex}`,
        })),
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
      cell: (participant) => <><p className="font-medium">{participant.participant.name ?? 'Nom non renseigné'}</p><p className="break-all text-xs text-muted-foreground">{participant.participant.email}</p></>,
    },
    {
      id: 'status',
      mobile: 'summary',
      header: 'Statut',
      cell: (participant) => <div className="flex flex-wrap gap-1">{participant.registration.cancelledAt ? <RefundedBadge cancelledAt={participant.registration.cancelledAt} /> : <Badge variant={participant.registration.checkedIn ? 'default' : 'secondary'}>{participant.registration.checkedIn ? 'Check-in' : 'À venir'}</Badge>}<Badge variant="outline">{participant.participant.accountStatus === 'claimed' ? 'Compte lié' : 'Invité'}</Badge></div>,
    },
    {
      id: 'ticket',
      mobile: 'summary',
      header: 'Billet',
      cell: (participant) => <><p>{participant.ticket.name ?? '—'}</p><p className="text-xs text-muted-foreground">{participant.ticket.operations.status === 'unconfigured' ? 'Règles à configurer' : participant.ticket.operations.departureMode === 'wave' ? 'Départ par SAS' : participant.ticket.operations.departureMode === 'fixed' ? 'Départ fixe' : 'Aucun départ géré'}</p></>,
    },
    { id: 'bib', mobile: 'detail', header: 'Dossard', cell: (participant) => participant.registration.bibNumber ?? '—' },
    {
      id: 'departure',
      mobile: 'detail',
      header: 'Départ',
      cell: (participant) => participant.departure.startTime ? <><p>{formatDate(participant.departure.startTime)}</p><p className="text-xs text-muted-foreground">SAS {participant.departure.waveIndex ?? '—'}</p></> : '—',
    },
    {
      id: 'payment',
      mobile: 'detail',
      header: 'Paiement',
      cell: (participant) => participant.payment ? <><p>{orderStatusLabel(participant.payment.status)}</p><p className="text-xs text-muted-foreground">{formatAmount(participant.payment.amountCents, participant.payment.currency)}</p></> : '—',
    },
    { id: 'group', mobile: 'detail', header: 'Groupe', cell: (participant) => participant.group ?? '—', hiddenByDefault: true },
    { id: 'created-at', mobile: 'detail', header: 'Inscrit le', cell: (participant) => formatDate(participant.registration.createdAt), hiddenByDefault: true },
    { id: 'cancellation', mobile: 'detail', header: 'Motif d’annulation', cell: (participant) => participant.registration.cancellationReason ?? '—', hiddenByDefault: true },
  ]

  const copyEmails = async (items: EventParticipantRow[]) => {
    const emails = [...new Set(items.map((item) => item.participant.email))].join(', ')
    try {
      await navigator.clipboard.writeText(emails)
      setNotice({ tone: 'success', text: `${items.length} adresse${items.length > 1 ? 's' : ''} copiée${items.length > 1 ? 's' : ''}.` })
    } catch {
      setNotice({ tone: 'error', text: 'Copie impossible : autorise l’accès au presse-papiers.' })
    }
  }

  const sendTicketAgain = (participant: EventParticipantRow) => {
    resendTicket.mutate(
      { registrationId: participant.id },
      {
        onSuccess: (result) => setNotice({ tone: 'success', text: `Billet renvoyé à ${result.to}.` }),
        onError: (mutationError) => setNotice({ tone: 'error', text: mutationError.message }),
      },
    )
  }

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
    {
      id: 'resend-ticket',
      label: 'Renvoyer le billet',
      onSelect: sendTicketAgain,
      disabled: (participant) => Boolean(participant.registration.cancelledAt) || resendTicket.isPending,
    },
    { id: 'copy-email', label: 'Copier l’e-mail', onSelect: (participant) => void copyEmails([participant]) },
    {
      id: 'cancel',
      label: 'Annuler l’inscription',
      destructive: true,
      onSelect: setCancelTarget,
      disabled: (participant) => Boolean(participant.registration.cancelledAt),
    },
  ]

  const exportUrl = participantsExportUrl(params)

  return (
    <div className="space-y-3">
      {notice ? (
        <Alert variant={notice.tone === 'error' ? 'destructive' : 'default'} role="status">
          <AlertDescription className="flex items-center justify-between gap-3">
            <span>{notice.text}</span>
            <Button type="button" variant="ghost" size="sm" onClick={() => setNotice(null)}>Fermer</Button>
          </AlertDescription>
        </Alert>
      ) : null}
      <OperationsList
        storageKey="event-participants"
        data={{ items: participants, nextCursor: page?.nextCursor ?? null, total: page?.totalCount }}
        status={error ? 'error' : isLoading && !data ? 'loading' : isFetching ? 'stale' : 'idle'}
        errorMessage={error?.message}
        onRetry={() => void refetch()}
        getItemId={(participant) => participant.id}
        columns={columns}
        filters={filters}
        onFilterChange={(filterId, value) => {
          if (filterId === 'check-in') changeCheckIn(value || 'all')
          if (filterId === 'status') changeStatus(value || 'all')
          if (filterId === 'ticket') changeTicket(value)
          if (filterId === 'wave') changeWave(value)
          if (filterId === 'sort') changeSort(value as EventParticipantSort)
          if (filterId === 'direction') {
            resetPagination()
            setDirection(value as 'asc' | 'desc')
          }
          if (filterId === 'limit') changeLimit(value)
        }}
        search={search}
        searchPlaceholder="Nom, e-mail ou identifiant"
        onSearchChange={setSearch}
        toolbarActions={
          <>
            <Button type="button" variant="outline" size="sm" onClick={() => void refetch()} disabled={isFetching}>
              <RefreshCw className={isFetching ? 'animate-spin' : undefined} />
              Actualiser
            </Button>
            <Button asChild variant="outline" size="sm">
              <a href={exportUrl} download><Download />Exporter en CSV</a>
            </Button>
          </>
        }
        selectedIds={selectedIds}
        onSelectedIdsChange={setSelectedIds}
        bulkActions={[{ id: 'copy-emails', label: 'Copier les e-mails', onSelect: (items) => void copyEmails(items) }]}
        rowActions={rowActions}
        pagination={{ cursor, previousCursors, nextCursor: page?.nextCursor ?? null, total: page?.totalCount, limit }}
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
        detailTitle={(participant) => participant.participant.name ?? participant.participant.email}
        detailDescription={() => 'Consultez l’inscription, prévisualisez une correction avant de la confirmer, ou annulez-la.'}
        renderDetail={(participant) => {
          const actions = getParticipantQuickActionState(participant)
          const cancelled = Boolean(participant.registration.cancelledAt)
          return <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/20 p-3" aria-label="Actions participant">
              <span className="mr-1 text-sm font-medium">Prévisualiser</span>
              <Button type="button" size="sm" variant={selectedPreview === 'ticket' ? 'secondary' : 'outline'} onClick={() => setSelectedPreview('ticket')} disabled={actions.ticket.disabled}>Changement de billet</Button>
              <Button type="button" size="sm" variant={selectedPreview === 'wave' ? 'secondary' : 'outline'} onClick={() => setSelectedPreview('wave')} disabled={actions.wave.disabled}>Changement de SAS</Button>
              {actions.wave.disabled ? <span className="text-xs text-muted-foreground">{actions.wave.reason}</span> : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="outline" disabled={cancelled || resendTicket.isPending} onClick={() => sendTicketAgain(participant)}>Renvoyer le billet</Button>
              <Button type="button" size="sm" variant="outline" onClick={() => void copyEmails([participant])}>Copier l’e-mail</Button>
              <Button type="button" size="sm" variant="destructive" disabled={cancelled} onClick={() => setCancelTarget(participant)}>Annuler l’inscription</Button>
            </div>
            <div className="grid gap-4 text-sm sm:grid-cols-2">
              <div><p className="text-muted-foreground">Email</p><p className="break-all">{participant.participant.email}</p></div>
              <div><p className="text-muted-foreground">Inscription</p><p className="break-all font-mono text-xs">{participant.id}</p></div>
              <div><p className="text-muted-foreground">Billet</p><p>{participant.ticket.name ?? '—'}</p></div>
              <div><p className="text-muted-foreground">Dossard</p><p>{participant.registration.bibNumber ?? '—'}</p></div>
              <div><p className="text-muted-foreground">Départ</p><p>{participant.departure.startTime ? `${formatDate(participant.departure.startTime)} · SAS ${participant.departure.waveIndex ?? '—'}` : '—'}</p></div>
              <div><p className="text-muted-foreground">Groupe</p><p>{participant.group ?? 'Aucun'}</p></div>
              <div><p className="text-muted-foreground">Paiement</p><p>{participant.payment ? `${orderStatusLabel(participant.payment.status)} · ${formatAmount(participant.payment.amountCents, participant.payment.currency)}` : '—'}</p></div>
              <div><p className="text-muted-foreground">Inscrit le</p><p>{formatDate(participant.registration.createdAt)}</p></div>
              {cancelled ? <div className="sm:col-span-2"><p className="text-muted-foreground">Annulée le {formatDate(participant.registration.cancelledAt ?? null)}</p><p>{participant.registration.cancellationReason ?? 'Motif non renseigné'}</p></div> : null}
            </div>
            {selectedPreview === 'ticket' ? <TicketChangePreviewPanel eventId={eventId} participant={participant} /> : null}
            {selectedPreview === 'wave' ? <WaveChangePreviewPanel eventId={eventId} participant={participant} /> : null}
          </div>
        }}
      />
      <CancelRegistrationDialog
        participant={cancelTarget}
        onOpenChange={(open) => !open && setCancelTarget(null)}
        onCancelled={(text) => {
          setCancelTarget(null)
          setSelectedParticipantId(null)
          setNotice({ tone: 'success', text })
        }}
      />
    </div>
  )
}
