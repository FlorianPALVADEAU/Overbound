'use client'

import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight, Clock, Search } from 'lucide-react'
import { useEventParticipants, type EventParticipantCheckInFilter, type EventParticipantSort, type EventParticipantRow } from '@/app/api/admin/events/participantsQueries'
import { TicketChangePreviewPanel } from './TicketChangePreviewPanel'
import { WaveChangePreviewPanel } from './WaveChangePreviewPanel'
import {
  parseParticipantUrlState,
  writeParticipantUrlState,
} from './participantUrlState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

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
  const [selectedParticipant, setSelectedParticipant] = useState<EventParticipantRow | null>(null)
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

  const changeDirection = () => {
    resetPagination()
    setDirection((value) => value === 'asc' ? 'desc' : 'asc')
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
    setPreviousCursors([])
  }, [eventId, searchParams])

  useEffect(() => {
    const next = writeParticipantUrlState(searchParams, { checkIn, sort, direction, cursor, limit })
    const current = searchParams.toString()
    if (next === current) return
    router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false })
  }, [checkIn, cursor, direction, limit, pathname, router, searchParams, sort])

  const params = useMemo(
    () => ({ eventId, cursor, direction, limit, query: deferredSearch || undefined, checkIn, sort }),
    [checkIn, cursor, deferredSearch, direction, eventId, limit, sort],
  )
  const { data, error, isLoading, isFetching } = useEventParticipants(params)
  const participants = data?.participants ?? []
  const page = data?.page

  const pageLabel = previousCursors.length + 1
  const canGoNext = Boolean(page?.nextCursor)
  const canGoPrevious = previousCursors.length > 0

  const goNext = () => {
    if (!page?.nextCursor) return
    setPreviousCursors((current) => [...current, cursor ?? ''])
    setCursor(page.nextCursor)
  }

  const goPrevious = () => {
    const previous = previousCursors.at(-1)
    if (previous === undefined) return
    setPreviousCursors((current) => current.slice(0, -1))
    setCursor(previous || null)
  }

  if (error) {
    return <p className="rounded-lg border border-destructive/30 p-4 text-sm text-destructive">{error.message}</p>
  }

  return (
    <section className="space-y-4" aria-label="Liste des participants">
      <div className="flex flex-col gap-3 rounded-lg border bg-card p-4 md:flex-row md:items-end md:justify-between">
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          <div className="space-y-1.5 sm:col-span-2 md:col-span-1">
            <Label htmlFor="participant-search">Rechercher</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="participant-search"
                className="pl-9"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Email ou identifiant"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Check-in</Label>
            <Select value={checkIn} onValueChange={changeCheckIn}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="checked_in">Effectué</SelectItem>
                <SelectItem value="not_checked_in">À faire</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Trier par</Label>
            <Select value={sort} onValueChange={changeSort}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Date d’inscription</SelectItem>
                <SelectItem value="email">Email</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-end gap-2">
          <Button variant="outline" size="sm" onClick={changeDirection}>
            {direction === 'asc' ? 'Croissant' : 'Décroissant'}
          </Button>
          <Select value={String(limit)} onValueChange={changeLimit}>
            <SelectTrigger className="w-20" aria-label="Lignes par page"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[25, 50, 100].map((size) => <SelectItem key={size} value={String(size)}>{size}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border bg-card">
        <div className="flex items-center justify-between border-b px-4 py-3 text-sm text-muted-foreground">
          <span>{page?.totalCount ?? 0} participant{(page?.totalCount ?? 0) > 1 ? 's' : ''}</span>
          {isFetching ? <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 animate-spin" />Actualisation…</span> : null}
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Participant</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Billet</TableHead>
                <TableHead>Départ</TableHead>
                <TableHead>Groupe</TableHead>
                <TableHead>Paiement</TableHead>
                <TableHead>Inscrit le</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && !data ? (
                <TableRow><TableCell colSpan={7} className="py-12 text-center text-muted-foreground"><Clock className="mx-auto mb-2 h-5 w-5 animate-spin" />Chargement…</TableCell></TableRow>
              ) : participants.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="py-12 text-center text-muted-foreground">Aucun participant ne correspond à ces critères.</TableCell></TableRow>
              ) : participants.map((participant) => (
                <TableRow key={participant.id}>
                  <TableCell>
                    <Button
                      variant="link"
                      className="h-auto p-0 font-medium"
                      onClick={() => setSelectedParticipant(participant)}
                    >
                      {participant.participant.name ?? 'Nom non renseigné'}
                    </Button>
                    <div className="text-xs text-muted-foreground">{participant.participant.email}</div>
                  </TableCell>
                  <TableCell><div className="flex flex-wrap gap-1"><Badge variant={participant.registration.checkedIn ? 'default' : 'secondary'}>{participant.registration.checkedIn ? 'Check-in' : 'À venir'}</Badge><Badge variant="outline">{participant.participant.accountStatus === 'claimed' ? 'Compte lié' : 'Invité'}</Badge></div></TableCell>
                  <TableCell><div>{participant.ticket.name ?? '—'}</div><div className="text-xs text-muted-foreground">{participant.ticket.format}</div></TableCell>
                  <TableCell>{participant.departure.startTime ? <><div>{formatDate(participant.departure.startTime)}</div><div className="text-xs text-muted-foreground">SAS {participant.departure.waveIndex ?? '—'}</div></> : '—'}</TableCell>
                  <TableCell>{participant.group ?? '—'}</TableCell>
                  <TableCell>{participant.payment ? <><div>{participant.payment.status ?? '—'}</div><div className="text-xs text-muted-foreground">{formatAmount(participant.payment.amountCents, participant.payment.currency)}</div></> : '—'}</TableCell>
                  <TableCell>{formatDate(participant.registration.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between border-t px-4 py-3">
          <span className="text-sm text-muted-foreground">Page {pageLabel}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={goPrevious} disabled={!canGoPrevious}><ChevronLeft className="mr-1 h-4 w-4" />Précédente</Button>
            <Button variant="outline" size="sm" onClick={goNext} disabled={!canGoNext}>Suivante<ChevronRight className="ml-1 h-4 w-4" /></Button>
          </div>
        </div>
      </div>

      <Dialog
        open={Boolean(selectedParticipant)}
        onOpenChange={(open) => {
          if (!open) setSelectedParticipant(null)
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Détail participant</DialogTitle>
            <DialogDescription>
              Consultation en lecture seule. Les changements de billet et de SAS seront ajoutés dans un parcours séparé.
            </DialogDescription>
          </DialogHeader>
          {selectedParticipant ? (
            <>
              <div className="grid gap-4 text-sm sm:grid-cols-2">
                <div><p className="text-muted-foreground">Nom</p><p className="font-medium">{selectedParticipant.participant.name ?? 'Non renseigné'}</p></div>
                <div><p className="text-muted-foreground">Compte</p><p>{selectedParticipant.participant.accountStatus === 'claimed' ? 'Compte lié' : 'Invité'}</p></div>
                <div><p className="text-muted-foreground">Email</p><p className="break-all">{selectedParticipant.participant.email}</p></div>
                <div><p className="text-muted-foreground">Inscription</p><p className="font-mono text-xs break-all">{selectedParticipant.id}</p></div>
                <div><p className="text-muted-foreground">Billet / format</p><p>{selectedParticipant.ticket.name ?? '—'} · {selectedParticipant.ticket.format}</p></div>
                <div><p className="text-muted-foreground">Départ</p><p>{selectedParticipant.departure.startTime ? `${formatDate(selectedParticipant.departure.startTime)} · SAS ${selectedParticipant.departure.waveIndex ?? '—'}` : '—'}</p></div>
                <div><p className="text-muted-foreground">Groupe</p><p>{selectedParticipant.group ?? 'Aucun'}</p></div>
                <div><p className="text-muted-foreground">Paiement</p><p>{selectedParticipant.payment ? `${selectedParticipant.payment.status ?? '—'} · ${formatAmount(selectedParticipant.payment.amountCents, selectedParticipant.payment.currency)}` : '—'}</p></div>
                <div><p className="text-muted-foreground">Check-in</p><p>{selectedParticipant.registration.checkedIn ? 'Effectué' : 'À faire'}</p></div>
                <div><p className="text-muted-foreground">Inscrit le</p><p>{formatDate(selectedParticipant.registration.createdAt)}</p></div>
              </div>
              <TicketChangePreviewPanel eventId={eventId} participant={selectedParticipant} />
              <WaveChangePreviewPanel eventId={eventId} participant={selectedParticipant} />
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  )
}
