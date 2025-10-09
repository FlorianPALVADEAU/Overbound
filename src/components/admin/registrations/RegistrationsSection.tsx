'use client'

import { useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
import { Clock, Filter, RotateCcw } from 'lucide-react'
import { RegistrationStats } from './RegistrationStats'
import { RegistrationDocumentDialog } from './RegistrationDocumentDialog'
import { RegistrationApprovalDialog } from './RegistrationApprovalDialog'
import type { AdminRegistration, RegistrationApprovalStatus } from '@/types/Registration'
import {
  adminRegistrationsBuildKey,
  updateAdminRegistrationApproval,
  useAdminRegistrations,
} from '@/app/api/admin/registrations/registrationsQueries'
import { useAdminEvents } from '@/app/api/admin/events/eventsQueries'

interface RegistrationsSectionProps {
  eventId?: string
}

interface MessageState {
  type: 'success' | 'error'
  text: string
}

interface RegistrationStatsState {
  total: number
  approved: number
  pending: number
  rejected: number
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

const formatAmount = (amount?: number | null, currency?: string | null) => {
  if (amount == null) return '—'
  return (amount / 100).toLocaleString('fr-FR', {
    style: 'currency',
    currency: (currency || 'EUR').toUpperCase(),
  })
}

const approvalBadgeVariant = (status: RegistrationApprovalStatus) => {
  switch (status) {
    case 'approved':
      return 'default' as const
    case 'rejected':
      return 'destructive' as const
    case 'pending':
    default:
      return 'secondary' as const
  }
}

const approvalBadgeLabel = (status: RegistrationApprovalStatus) => {
  switch (status) {
    case 'approved':
      return 'Approuvé'
    case 'rejected':
      return 'Rejeté'
    case 'pending':
    default:
      return 'En attente'
  }
}

export function RegistrationsSection({ eventId }: RegistrationsSectionProps) {
  const queryClient = useQueryClient()
  const { data: events = [] } = useAdminEvents()

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<RegistrationApprovalStatus | 'all'>('all')
  const [eventFilter, setEventFilter] = useState<string>(ALL_EVENTS_VALUE)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [message, setMessage] = useState<MessageState | null>(null)
  const [selectedRegistration, setSelectedRegistration] = useState<AdminRegistration | null>(null)
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false)
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')

  useEffect(() => {
    if (eventId) {
      setEventFilter(eventId)
    }
  }, [eventId])

  const params = useMemo(
    () => ({
      eventId: eventFilter !== ALL_EVENTS_VALUE ? eventFilter : undefined,
      approvalFilter: statusFilter,
      searchTerm: searchTerm.trim() || undefined,
      limit: DEFAULT_LIMIT,
    }),
    [eventFilter, statusFilter, searchTerm]
  )

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
      approved: 0,
      pending: 0,
      rejected: 0,
      checked_in: 0,
    }

    registrations.forEach((registration) => {
      if (registration.approval_status === 'approved') snapshot.approved += 1
      if (registration.approval_status === 'pending') snapshot.pending += 1
      if (registration.approval_status === 'rejected') snapshot.rejected += 1
      if (registration.checked_in) snapshot.checked_in += 1
    })

    return snapshot
  }, [registrations])

  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (eventFilter !== ALL_EVENTS_VALUE) count += 1
    if (statusFilter !== 'all') count += 1
    if (searchTerm.trim()) count += 1
    return count
  }, [eventFilter, statusFilter, searchTerm])

  const handleViewDocument = (registration: AdminRegistration) => {
    setSelectedRegistration(registration)
    setDocumentDialogOpen(true)
  }

  const handleOpenApproval = (registration: AdminRegistration) => {
    setSelectedRegistration(registration)
    setRejectionReason('')
    setApprovalDialogOpen(true)
  }

  const handleApproval = async (
    registration: AdminRegistration,
    status: Exclude<RegistrationApprovalStatus, 'pending'>,
    reason?: string
  ) => {
    setActionLoadingId(registration.id)
    try {
      await updateAdminRegistrationApproval(registration.id, status, reason)
      queryClient.setQueryData<typeof data>(queryKey, (previous) => {
        if (!previous) return previous
        return {
          ...previous,
          registrations: previous.registrations.map((item) =>
            item.id === registration.id
              ? {
                  ...item,
                  approval_status: status,
                  rejection_reason: status === 'rejected' ? reason || null : null,
                  approved_at: status === 'approved' ? new Date().toISOString() : item.approved_at,
                }
              : item
          ),
        }
      })
      setMessage({
        type: 'success',
        text: `Inscription ${status === 'approved' ? 'approuvée' : 'rejetée'} avec succès`,
      })
      setApprovalDialogOpen(false)
      setSelectedRegistration(null)
      setRejectionReason('')
    } catch (error) {
      const text = axios.isAxiosError(error)
        ? error.response?.data?.error || error.message
        : (error as Error).message || 'Erreur lors de la mise à jour du statut'
      setMessage({ type: 'error', text })
    } finally {
      setActionLoadingId(null)
    }
  }

  const resetFilters = () => {
    setEventFilter(ALL_EVENTS_VALUE)
    setStatusFilter('all')
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

      <Card>
        <CardContent className="space-y-4 p-4 md:p-6">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="space-y-1 md:col-span-2">
              <Label>Recherche</Label>
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Email, événement, ticket…"
              />
            </div>

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

            <div className="space-y-1">
              <Label>Statut</Label>
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as RegistrationApprovalStatus | 'all')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="approved">Approuvés</SelectItem>
                  <SelectItem value="rejected">Rejetés</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Réinitialiser
            </Button>
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
                <TableHead>Statut</TableHead>
                <TableHead>Créé le</TableHead>
                <TableHead className="w-[160px] text-right">Actions</TableHead>
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
                        <span className="font-medium">{registration.email}</span>
                        {registration.user_id ? (
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
                            registration.order?.amount_total ?? null,
                            registration.order?.currency ?? null
                          )}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5">
                        <Badge variant={approvalBadgeVariant(registration.approval_status)}>
                          {approvalBadgeLabel(registration.approval_status)}
                        </Badge>
                        {registration.checked_in ? (
                          <Badge variant="outline" className="border-emerald-200 text-emerald-600">
                            Check-in
                          </Badge>
                        ) : null}
                        {registration.requires_document ? (
                          (() => {
                            const hasDocument = Boolean(registration.document_url?.trim())
                            if (!hasDocument) {
                              return (
                                <Badge variant="outline" className="border-amber-200 text-amber-600">
                                  Document manquant
                                </Badge>
                              )
                            }

                            if (registration.approval_status === 'approved') {
                              return (
                                <Badge variant="outline" className="border-emerald-200 text-emerald-600">
                                  Document validé
                                </Badge>
                              )
                            }

                            if (registration.approval_status === 'rejected') {
                              return (
                                <Badge variant="outline" className="border-red-200 text-red-600">
                                  Document rejeté
                                </Badge>
                              )
                            }

                            return (
                              <Badge variant="outline" className="border-sky-200 text-sky-600">
                                Validation en cours
                              </Badge>
                            )
                          })()
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>{formatDateTime(registration.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDocument(registration)}
                          disabled={!registration.document_url?.trim()}
                        >
                          Voir doc
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleOpenApproval(registration)}
                          disabled={actionLoadingId === registration.id}
                        >
                          {actionLoadingId === registration.id ? (
                            <Clock className="h-4 w-4 animate-spin" />
                          ) : (
                            'Statut'
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

      <RegistrationDocumentDialog
        registration={selectedRegistration}
        open={documentDialogOpen}
        onOpenChange={(open) => {
          setDocumentDialogOpen(open)
          if (!open) {
            setSelectedRegistration(null)
          }
        }}
      />

      <RegistrationApprovalDialog
        registration={selectedRegistration}
        open={approvalDialogOpen}
        loadingId={actionLoadingId}
        rejectionReason={rejectionReason}
        onOpenChange={(open) => {
          setApprovalDialogOpen(open)
          if (!open) {
            setSelectedRegistration(null)
            setRejectionReason('')
          }
        }}
        onRejectionReasonChange={setRejectionReason}
        onApprove={() => selectedRegistration && handleApproval(selectedRegistration, 'approved')}
        onReject={() =>
          selectedRegistration &&
          handleApproval(selectedRegistration, 'rejected', rejectionReason)
        }
      />
    </div>
  )
}
