'use client'

import { useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Clock, Download, Filter, Package, RotateCcw, Trash2 } from 'lucide-react'
import type { UpsellSummaryRow } from '@/app/api/admin/registrations/upsells-summary/route'
import { RegistrationStats } from './RegistrationStats'
import { RegistrationDetailsDialog } from './RegistrationDetailsDialog'
import { DeleteConfirmationDialog } from '@/components/admin/ui/DeleteConfirmationDialog'
import type { AdminRegistration } from '@/types/Registration'
import {
  adminRegistrationsBuildKey,
  deleteAdminRegistration,
  useAdminRegistrations,
} from '@/app/api/admin/registrations/registrationsQueries'
import { useAdminEvents } from '@/app/api/admin/events/eventsQueries'
import { formatClockTimeParis } from '@/lib/dateTime'

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
const DEFAULT_LIMIT = 250

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
  const [message, setMessage] = useState<MessageState | null>(null)
  const [detailsRegistration, setDetailsRegistration] = useState<AdminRegistration | null>(null)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)

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

  const params = useMemo(
    () => ({
      eventId: effectiveEventFilter !== ALL_EVENTS_VALUE ? effectiveEventFilter : undefined,
      searchTerm: searchTerm.trim() || undefined,
      limit: DEFAULT_LIMIT,
    }),
    [effectiveEventFilter, searchTerm]
  )

  const exportUrl = useMemo(() => {
    const search = new URLSearchParams()
    if (params.eventId) search.set('event_id', params.eventId)
    if (params.searchTerm) search.set('search_term', params.searchTerm)
    search.set('format', 'csv')
    search.set('limit', '10000')
    return `/api/admin/registrations?${search.toString()}`
  }, [params])

  const {
    data,
    isLoading,
    isFetching,
    error: registrationsError,
  } = useAdminRegistrations(params)

  const registrations = useMemo(() => data?.registrations ?? [], [data])
  const totalCount = data?.totalCount ?? registrations.length
  const queryKey = adminRegistrationsBuildKey(params)

  const stats = useMemo<RegistrationStatsState>(() => {
    const snapshot = {
      total: registrations.length,
      checked_in: 0,
    }

    registrations.forEach((registration) => {
      if (registration.checked_in) snapshot.checked_in += 1
    })

    return snapshot
  }, [registrations])

  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (!lockEventFilter && eventFilter !== ALL_EVENTS_VALUE) count += 1
    if (searchTerm.trim()) count += 1
    return count
  }, [eventFilter, lockEventFilter, searchTerm])

  const handleViewDetails = (registration: AdminRegistration) => {
    setDetailsRegistration(registration)
    setDetailsDialogOpen(true)
  }

  const handleDeleteClick = (registration: AdminRegistration) => {
    setRegistrationToDelete(registration)
    setDeleteDialogOpen(true)
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

      <Card>
        <CardContent className="space-y-4 p-4 md:p-6">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-1 md:col-span-2">
          <Label>Recherche</Label>
          <Input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Email, événement, ticket…"
          />
        </div>

        {lockEventFilter ? (
          <div className="space-y-1">
            <Label>Événement</Label>
            <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
              {events.find((eventOption) => eventOption.id === eventId)?.title ?? 'Événement sélectionné'}
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            <Label>Événement</Label>
            <Select value={eventFilter} onValueChange={setEventFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les événements" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_EVENTS_VALUE}>Tous les événements</SelectItem>
                {events.map((eventOption) => (
                  <SelectItem key={eventOption.id} value={eventOption.id}>
                    {eventOption.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Filter className="h-4 w-4" />
              <span>
                {activeFiltersCount > 0
                  ? `${activeFiltersCount} filtre${activeFiltersCount > 1 ? 's' : ''} actif${
                      activeFiltersCount > 1 ? 's' : ''
                    }`
                  : 'Aucun filtre actif'}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href={exportUrl} target="_blank" rel="noopener noreferrer">
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </a>
              </Button>
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Réinitialiser
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {message && (
        <Alert variant={alertVariant}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-3 rounded-xl border bg-card p-4 shadow-sm md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
          <span>
            {totalCount} inscription{totalCount > 1 ? 's' : ''} au total
          </span>
          {isFetching && (
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4 animate-spin" />
              Actualisation…
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Participant</TableHead>
                <TableHead>Événement</TableHead>
                <TableHead>Billet &amp; montant</TableHead>
                <TableHead>Présence</TableHead>
                <TableHead>Créé le</TableHead>
                <TableHead className="w-[220px] text-right">Actions</TableHead>
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

// ─── Upsell Summary Panel ─────────────────────────────────────────────────────

function UpsellSummaryPanel({ eventId }: { eventId?: string }) {
  const { data, isLoading } = useQuery<{ summary: UpsellSummaryRow[] }>({
    queryKey: ['admin-upsells-summary', eventId ?? 'all'],
    queryFn: async () => {
      const url = eventId
        ? `/api/admin/registrations/upsells-summary?event_id=${eventId}`
        : '/api/admin/registrations/upsells-summary'
      const res = await fetch(url)
      if (!res.ok) throw new Error('Erreur chargement upsells')
      return res.json()
    },
    staleTime: 60_000,
  })

  const summary = data?.summary ?? []

  if (!isLoading && summary.length === 0) return null

  const formatAmount = (cents: number, currency: string) =>
    (cents / 100).toLocaleString('fr-FR', {
      style: 'currency',
      currency: currency.toUpperCase(),
    })

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Package className="h-4 w-4 text-primary" />
          Options vendues (upsells)
          {eventId ? null : (
            <span className="text-xs font-normal text-muted-foreground ml-1">— tous événements</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex items-center gap-2 px-6 py-4 text-sm text-muted-foreground">
            <Clock className="h-4 w-4 animate-spin" />
            Chargement…
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Option</TableHead>
                <TableHead>Détails</TableHead>
                <TableHead className="text-center w-24">Qté vendue</TableHead>
                <TableHead className="text-right w-36">CA total</TableHead>
                <TableHead className="text-right w-36">Prix unitaire moy.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary.map((row) => (
                <TableRow key={`${row.name}-${row.currency}`}>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {Array.isArray((row as any).specs_breakdown) && (row as any).specs_breakdown.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {(row as any).specs_breakdown.map((item: any) => (
                          <Badge key={`${row.name}-${item.label}`} variant="outline" className="text-xs">
                            {item.label} x{item.quantity}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span>-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center tabular-nums">
                    <Badge variant="secondary">{row.quantity}</Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-medium text-green-600">
                    {formatAmount(row.total_cents, row.currency)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground text-sm">
                    {formatAmount(Math.round(row.total_cents / row.quantity), row.currency)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
