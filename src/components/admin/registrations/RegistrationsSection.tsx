'use client'

import { useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  RotateCcw,
  SlidersHorizontal,
  Trash2,
} from 'lucide-react'
import { RegistrationStats } from './RegistrationStats'
import { RegistrationDetailsDialog } from './RegistrationDetailsDialog'
import { RegistrationOperationsDialog } from './RegistrationOperationsDialog'
import { UpsellSummaryPanel } from './UpsellSummaryPanel'
import { DeleteConfirmationDialog } from '@/components/admin/ui/DeleteConfirmationDialog'
import type { AdminRegistration } from '@/types/Registration'
import {
  adminRegistrationsBuildKey,
  adminRegistrationsQueryKeyBase,
  deleteAdminRegistration,
  useAdminRegistrations,
} from '@/app/api/admin/registrations/registrationsQueries'
import { useAdminEvents } from '@/app/api/admin/events/eventsQueries'
import { formatClockTimeParis } from '@/lib/dateTime'
import { OperationsList, type OperationsListAction, type OperationsListColumn } from '@/components/admin/operations'

interface RegistrationsSectionProps {
  eventId?: string
  lockEventFilter?: boolean
}

interface MessageState {
  type: 'success' | 'error'
  text: string
}

interface RegistrationStatsState {
  total: number
  checked_in: number
}

const ALL_EVENTS_VALUE = '__all__'
const PAGE_SIZE_OPTIONS = [25, 50, 100, 250, 500]
const DEFAULT_LIMIT = 100

const formatDateTime = (value?: string | null) =>
  value
    ? new Date(value).toLocaleString('fr-FR', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : '—'

const formatStartTime = (value?: string | null) =>
  formatClockTimeParis(value) ?? '—'

const formatAmount = (amount?: number | null, currency?: string | null) => {
  if (amount == null) return '—'
  return (amount / 100).toLocaleString('fr-FR', {
    style: 'currency',
    currency: (currency || 'EUR').toUpperCase(),
  })
}

const formatPromoDiscount = (promo: {
  discount_percent?: number | null
  discount_amount?: number | null
  currency?: string | null
}) => {
  if (typeof promo.discount_percent === 'number' && promo.discount_percent > 0) {
    return `-${promo.discount_percent}%`
  }
  if (typeof promo.discount_amount === 'number' && promo.discount_amount > 0) {
    return `-${formatAmount(promo.discount_amount, promo.currency ?? 'EUR')}`
  }
  return null
}

const getParticipantName = (registration: AdminRegistration) => {
  const emailLocalPart = registration.email.split('@')[0]?.trim()
  const emailDerivedName = emailLocalPart
    ? emailLocalPart
        .replace(/[._-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/\b\w/g, (char) => char.toUpperCase())
    : null
  const registrationsCount = (registration.order as any)?.registrations_count
  const isSharedOrder = typeof registrationsCount === 'number' && registrationsCount > 1

  if (isSharedOrder && emailDerivedName) return emailDerivedName

  const fullName = registration.participant_profile?.full_name?.trim()
  if (fullName) return fullName

  if (emailDerivedName) return emailDerivedName

  return 'Nom non renseigné'
}

export function RegistrationsSection({ eventId, lockEventFilter = false }: RegistrationsSectionProps) {
  const queryClient = useQueryClient()
  const { data: events = [] } = useAdminEvents()

  const [searchTerm, setSearchTerm] = useState('')
  const [eventFilter, setEventFilter] = useState<string>(ALL_EVENTS_VALUE)
  const [ticketType, setTicketType] = useState<'all' | 'open' | 'ranked'>('all')
  const [pageSize, setPageSize] = useState(DEFAULT_LIMIT)
  const [pageIndex, setPageIndex] = useState(0)
  const [message, setMessage] = useState<MessageState | null>(null)
  const [detailsRegistration, setDetailsRegistration] = useState<AdminRegistration | null>(null)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [operationsRegistration, setOperationsRegistration] = useState<AdminRegistration | null>(null)
  const [operationsDialogOpen, setOperationsDialogOpen] = useState(false)

  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [registrationToDelete, setRegistrationToDelete] = useState<AdminRegistration | null>(null)
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null)

  useEffect(() => {
    if (eventId) {
      setEventFilter(eventId)
    } else if (!lockEventFilter) {
      setEventFilter(ALL_EVENTS_VALUE)
    }
  }, [eventId, lockEventFilter])

  const effectiveEventFilter = lockEventFilter && eventId ? eventId : eventFilter

  // Revenir à la première page dès qu'un filtre ou la taille de page change.
  useEffect(() => {
    setPageIndex(0)
  }, [effectiveEventFilter, searchTerm, pageSize])

  const params = useMemo(
    () => ({
      eventId: effectiveEventFilter !== ALL_EVENTS_VALUE ? effectiveEventFilter : undefined,
      ticketType,
      searchTerm: searchTerm.trim() || undefined,
      limit: pageSize,
      offset: pageIndex * pageSize,
    }),
    [effectiveEventFilter, searchTerm, pageSize, pageIndex, ticketType]
  )

  const exportUrl = useMemo(() => {
    const search = new URLSearchParams()
    if (params.eventId) search.set('event_id', params.eventId)
    if (params.searchTerm) search.set('search_term', params.searchTerm)
    if (params.ticketType && params.ticketType !== 'all') search.set('ticket_type', params.ticketType)
    search.set('format', 'csv')
    search.set('limit', '10000')
    return `/api/admin/registrations?${search.toString()}`
  }, [params])

  const {
    data,
    isLoading,
    isFetching,
    error: registrationsError,
    refetch,
  } = useAdminRegistrations(params)

  const registrations = useMemo(() => data?.registrations ?? [], [data])
  const totalCount = data?.totalCount ?? registrations.length
  const queryKey = adminRegistrationsBuildKey(params)

  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize))
  const rangeStart = totalCount === 0 ? 0 : pageIndex * pageSize + 1
  const rangeEnd = Math.min(pageIndex * pageSize + registrations.length, totalCount)
  const canPrev = pageIndex > 0
  const canNext = pageIndex + 1 < pageCount

  // Si le nombre total baisse (suppression, changement de filtre), recaler la page.
  useEffect(() => {
    if (pageIndex > 0 && pageIndex >= pageCount) {
      setPageIndex(pageCount - 1)
    }
  }, [pageIndex, pageCount])

  const stats = useMemo<RegistrationStatsState>(() => {
    const snapshot = {
      total: totalCount,
      checked_in: 0,
    }

    registrations.forEach((registration) => {
      if (registration.checked_in) snapshot.checked_in += 1
    })

    return snapshot
  }, [registrations, totalCount])

  const handleViewDetails = (registration: AdminRegistration) => {
    setDetailsRegistration(registration)
    setDetailsDialogOpen(true)
  }

  const handleDeleteClick = (registration: AdminRegistration) => {
    setRegistrationToDelete(registration)
    setDeleteDialogOpen(true)
  }

  const handleOperations = (registration: AdminRegistration) => {
    setOperationsRegistration(registration)
    setOperationsDialogOpen(true)
  }

  const handleOperationsUpdated = async () => {
    await queryClient.invalidateQueries({ queryKey: adminRegistrationsQueryKeyBase })
    await refetch()
    setMessage({ type: 'success', text: 'Inscription mise à jour.' })
  }

  const handleDelete = async () => {
    if (!registrationToDelete) return

    setDeleteLoadingId(registrationToDelete.id)
    try {
      await deleteAdminRegistration(registrationToDelete.id)
      queryClient.setQueryData<typeof data>(queryKey, (previous) => {
        if (!previous) return previous
        return {
          ...previous,
          registrations: previous.registrations.filter(
            (item) => item.id !== registrationToDelete.id
          ),
          totalCount: previous.totalCount - 1,
        }
      })
      setMessage({ type: 'success', text: 'Inscription supprimée avec succès' })
      setDeleteDialogOpen(false)
      setRegistrationToDelete(null)
    } catch (error) {
      const text = axios.isAxiosError(error)
        ? error.response?.data?.error || error.message
        : (error as Error).message || 'Erreur lors de la suppression'
      setMessage({ type: 'error', text })
    } finally {
      setDeleteLoadingId(null)
    }
  }

  const resetFilters = () => {
    if (lockEventFilter && eventId) {
      setEventFilter(eventId)
    } else {
      setEventFilter(ALL_EVENTS_VALUE)
    }
    setSearchTerm('')
    setTicketType('all')
    setPageIndex(0)
  }

  if (registrationsError) {
    return (
      <div className="py-12 text-center text-destructive">
        {(registrationsError as Error).message || 'Impossible de charger les inscriptions'}
      </div>
    )
  }

  const initialLoading = isLoading && !data
  const alertVariant = message?.type === 'error' ? 'destructive' : 'default'

  const columns: OperationsListColumn<AdminRegistration>[] = [
    { id: 'participant', header: 'Participant', cell: (registration) => <div className="min-w-0"><p className="truncate font-medium">{getParticipantName(registration)}</p><p className="truncate text-xs text-muted-foreground">{registration.email}</p>{registration.group?.name ? <p className="truncate text-xs text-muted-foreground">Groupe : {registration.group.name}</p> : null}</div> },
    { id: 'event', header: 'Événement', cell: (registration) => <div className="min-w-0"><p className="truncate font-medium">{registration.event?.title ?? '—'}</p><p className="truncate text-xs text-muted-foreground">{registration.event?.location ?? ''}</p></div> },
    { id: 'ticket', header: 'Billet', cell: (registration) => <div className="min-w-0"><p className="truncate font-medium">{registration.ticket?.name ?? '—'}</p><p className="text-xs text-muted-foreground">{formatAmount((registration.order as any)?.amount_per_registration ?? registration.order?.amount_total ?? null, registration.order?.currency ?? null)}</p></div> },
    { id: 'presence', header: 'Présence', cell: (registration) => <Badge variant={registration.checked_in ? 'outline' : 'secondary'}>{registration.checked_in ? 'Check-in' : 'Non check-in'}</Badge> },
    { id: 'created-at', header: 'Créé le', cell: (registration) => formatDateTime(registration.created_at), hiddenByDefault: true },
  ]
  const rowActions: OperationsListAction<AdminRegistration>[] = [
    { id: 'manage', label: 'Gérer', onSelect: handleOperations },
    { id: 'details', label: 'Détails', onSelect: handleViewDetails },
    { id: 'delete', label: 'Supprimer', destructive: true, disabled: (registration) => deleteLoadingId === registration.id, onSelect: handleDeleteClick },
  ]

  if (initialLoading) {
    return (
      <div className="py-12 text-center">
        <Clock className="mx-auto mb-4 h-12 w-12 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground">Chargement des inscriptions…</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Gestion des membres</h2>
        <p className="text-muted-foreground">
          Consulte et modifie les statuts d&apos;inscription des participants.
        </p>
      </div>

      <RegistrationStats stats={stats} />

      <UpsellSummaryPanel eventId={effectiveEventFilter !== ALL_EVENTS_VALUE ? effectiveEventFilter : undefined} />

      {message && (
        <Alert variant={alertVariant}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-3 rounded-xl border bg-card p-4 shadow-sm md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
          <span>
            {totalCount > 0
              ? `${rangeStart}–${rangeEnd} sur ${totalCount} inscription${totalCount > 1 ? 's' : ''}`
              : '0 inscription'}
          </span>
          {isFetching && (
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4 animate-spin" />
              Actualisation…
            </span>
          )}
        </div>

        <OperationsList
          data={{ items: registrations, nextCursor: canNext ? String((pageIndex + 1) * pageSize) : null, total: totalCount }}
          status={registrationsError ? 'error' : isLoading && !data ? 'loading' : isFetching ? 'stale' : 'idle'}
          errorMessage={registrationsError ? 'Impossible de charger les inscriptions' : undefined}
          onRetry={() => refetch()}
          getItemId={(registration) => registration.id}
          columns={columns}
          search={searchTerm}
          searchPlaceholder="Email, événement, billet…"
          onSearchChange={setSearchTerm}
          filters={[
            ...(lockEventFilter ? [] : [{ id: 'event', label: 'Événement', value: eventFilter === ALL_EVENTS_VALUE ? '' : eventFilter, options: events.map((eventOption) => ({ value: eventOption.id, label: eventOption.title })) }]),
            { id: 'ticket-type', label: 'Type de billet', value: ticketType === 'all' ? '' : ticketType, options: [{ value: 'open', label: 'OPEN' }, { value: 'ranked', label: 'RANKED' }] },
            { id: 'page-size', label: 'Lignes', value: String(pageSize), options: PAGE_SIZE_OPTIONS.map((value) => ({ value: String(value), label: String(value) })) },
          ]}
          onFilterChange={(filterId, value) => {
            if (filterId === 'event') setEventFilter(value || ALL_EVENTS_VALUE)
            if (filterId === 'ticket-type') setTicketType((value || 'all') as typeof ticketType)
            if (filterId === 'page-size') setPageSize(Number(value))
            setPageIndex(0)
          }}
          rowActions={rowActions}
          toolbarActions={<>
            <Button variant="outline" size="sm" asChild><a href={exportUrl} target="_blank" rel="noopener noreferrer"><Download className="mr-2 h-4 w-4" />Export CSV</a></Button>
            <Button variant="ghost" size="sm" onClick={resetFilters}><RotateCcw className="mr-2 h-4 w-4" />Réinitialiser</Button>
          </>}
          pagination={{ cursor: pageIndex > 0 ? String(pageIndex * pageSize) : null, previousCursors: Array.from({ length: pageIndex }, (_, index) => String(index * pageSize)), nextCursor: canNext ? String((pageIndex + 1) * pageSize) : null, total: totalCount, limit: pageSize }}
          onPaginationChange={({ previousCursors }) => setPageIndex(previousCursors.length)}
          itemLabel="inscription"
        />

        <div className="hidden">
        <div className="min-w-0 overflow-hidden">
          <Table className="table-fixed [&_td]:min-w-0 [&_td]:break-words [&_th]:truncate">
            <TableHeader>
              <TableRow>
                <TableHead>Participant</TableHead>
                <TableHead>Événement</TableHead>
                <TableHead>Billet &amp; montant</TableHead>
                <TableHead>Présence</TableHead>
                <TableHead>Créé le</TableHead>
                <TableHead className="w-[260px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && registrations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center">
                    <Clock className="mx-auto mb-3 h-8 w-8 animate-spin text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Chargement des inscriptions…</p>
                  </TableCell>
                </TableRow>
              ) : registrations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                    Aucune inscription trouvée avec ces filtres.
                  </TableCell>
                </TableRow>
              ) : (
                registrations.map((registration) => (
                  <TableRow key={registration.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{getParticipantName(registration)}</span>
                        <span className="text-xs text-muted-foreground">{registration.email}</span>
                        {registration.group?.name ? (
                          <span className="text-xs text-muted-foreground">
                            Groupe: {registration.group.name}
                            {registration.group.invite_code ? ` (${registration.group.invite_code})` : ''}
                          </span>
                        ) : null}
                        <span className="text-xs text-muted-foreground">
                          Départ assigné: {formatStartTime(registration.start_time)}
                        </span>
                        {registration.user_id && !registration.participant_profile?.full_name ? (
                          <span className="text-xs text-muted-foreground">
                            Utilisateur #{registration.user_id.slice(0, 8)}
                          </span>
                        ) : null}
                        {registration.claim_status === 'transferred' ? (
                          <span className="text-xs text-amber-600">
                            Transfert en attente
                          </span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{registration.event?.title ?? '—'}</span>
                        {registration.event?.date ? (
                          <span className="text-xs text-muted-foreground">
                            {formatDateTime(registration.event.date)}
                          </span>
                        ) : null}
                        {registration.event?.location ? (
                          <span className="text-xs text-muted-foreground">
                            {registration.event.location}
                          </span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">
                          {registration.ticket?.name ?? '—'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatAmount(
                            (registration.order as any)?.amount_per_registration ??
                              registration.order?.amount_total ??
                              null,
                            registration.order?.currency ?? null
                          )}
                        </span>
                        {typeof (registration.order as any)?.registrations_count === 'number' &&
                        (registration.order as any).registrations_count > 1 ? (
                          <span className="text-[11px] text-muted-foreground">
                            Commande partagée ({(registration.order as any).registrations_count} participants)
                          </span>
                        ) : null}
                        <span className="text-[11px] text-muted-foreground">
                          Codes promo:{' '}
                          {Array.isArray(registration.promotional_codes) && registration.promotional_codes.length > 0
                            ? registration.promotional_codes
                                .map((promo) => {
                                  const discount = formatPromoDiscount(promo)
                                  return discount ? `${promo.code} (${discount})` : promo.code
                                })
                                .join(', ')
                            : 'Aucun'}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          T-shirt:{' '}
                          {registration.has_tshirt
                            ? `Oui${
                                (registration.tshirt_quantity ?? 0) > 0
                                  ? ` (x${registration.tshirt_quantity})`
                                  : ''
                              }${
                                Array.isArray(registration.tshirt_sizes) && registration.tshirt_sizes.length > 0
                                  ? ` • ${registration.tshirt_sizes.join(', ')}`
                                  : ''
                              }`
                            : 'Non'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5">
                        {registration.checked_in ? (
                          <Badge variant="outline" className="border-emerald-200 text-emerald-600">
                            Check-in
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            Non check-in
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{formatDateTime(registration.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleOperations(registration)}
                        >
                          <SlidersHorizontal className="mr-2 h-4 w-4" />
                          Gérer
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(registration)}
                        >
                          Détails
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteClick(registration)}
                          disabled={deleteLoadingId === registration.id}
                        >
                          {deleteLoadingId === registration.id ? (
                            <Clock className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Lignes par page</span>
            <Select
              value={String(pageSize)}
              onValueChange={(value) => setPageSize(Number(value))}
            >
              <SelectTrigger className="h-8 w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Page {pageIndex + 1} / {pageCount}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPageIndex(0)}
              disabled={!canPrev}
              aria-label="Première page (premier inscrit)"
            >
              <ChevronFirst className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPageIndex((index) => Math.max(0, index - 1))}
              disabled={!canPrev}
              aria-label="Page précédente"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPageIndex((index) => Math.min(pageCount - 1, index + 1))}
              disabled={!canNext}
              aria-label="Page suivante"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPageIndex(pageCount - 1)}
              disabled={!canNext}
              aria-label="Dernière page"
            >
              <ChevronLast className="h-4 w-4" />
            </Button>
          </div>
        </div>
        </div>
      </div>

      <RegistrationDetailsDialog
        registration={detailsRegistration}
        open={detailsDialogOpen}
        onOpenChange={(open) => {
          setDetailsDialogOpen(open)
          if (!open) {
            setDetailsRegistration(null)
          }
        }}
      />

      <RegistrationOperationsDialog
        registration={operationsRegistration}
        open={operationsDialogOpen}
        onOpenChange={(open) => {
          setOperationsDialogOpen(open)
          if (!open) setOperationsRegistration(null)
        }}
        onUpdated={handleOperationsUpdated}
      />

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open)
          if (!open) {
            setRegistrationToDelete(null)
          }
        }}
        title="Supprimer l'inscription"
        entityName={registrationToDelete?.email ?? ''}
        entityType="l'inscription de"
        warningMessage="Cette inscription sera définitivement supprimée."
        consequences={[
          'Le participant perdra son accès à l\'événement',
          'Les données de paiement associées ne seront pas affectées',
        ]}
        onConfirm={handleDelete}
        loading={deleteLoadingId === registrationToDelete?.id}
      />
    </div>
  )
}
