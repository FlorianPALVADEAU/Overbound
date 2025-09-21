'use client'

import { useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Clock } from 'lucide-react'
import { RegistrationStats } from './RegistrationStats'
import { RegistrationFilters } from './RegistrationFilters'
import { RegistrationEmptyState } from './RegistrationEmptyState'
import { RegistrationList } from './RegistrationList'
import { RegistrationDocumentDialog } from './RegistrationDocumentDialog'
import { RegistrationApprovalDialog } from './RegistrationApprovalDialog'
import type { AdminRegistration, RegistrationApprovalStatus } from '@/types/Registration'
import {
  adminRegistrationsBuildKey,
  updateAdminRegistrationApproval,
  useAdminRegistrations,
} from '@/app/api/admin/registrations/registrationsQueries'

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

export function RegistrationsSection({ eventId }: RegistrationsSectionProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<RegistrationApprovalStatus | 'all'>('all')
  const params = useMemo(
    () => ({ eventId, approvalFilter: statusFilter, searchTerm }),
    [eventId, statusFilter, searchTerm]
  )
  const queryClient = useQueryClient()
  const {
    data,
    isLoading,
    error: registrationsError,
  } = useAdminRegistrations(params)
  const registrations = useMemo(() => data?.registrations ?? [], [data])
  const queryKey = adminRegistrationsBuildKey(params)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [message, setMessage] = useState<MessageState | null>(null)
  const [selectedRegistration, setSelectedRegistration] = useState<AdminRegistration | null>(null)
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false)
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')

  const stats = useMemo<RegistrationStatsState>(() => {
    const data = {
      total: registrations.length,
      approved: 0,
      pending: 0,
      rejected: 0,
      checked_in: 0,
    }

    registrations.forEach((registration) => {
      if (registration.approval_status === 'approved') data.approved += 1
      if (registration.approval_status === 'pending') data.pending += 1
      if (registration.approval_status === 'rejected') data.rejected += 1
      if (registration.checked_in) data.checked_in += 1
    })

    return data
  }, [registrations])

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

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4 animate-spin" />
        <p className="text-muted-foreground">Chargement des inscriptions...</p>
      </div>
    )
  }

  if (registrationsError) {
    return (
      <div className="text-center py-12 text-destructive">
        {(registrationsError as Error).message || 'Impossible de charger les inscriptions'}
      </div>
    )
  }

  const hasFilters = Boolean(searchTerm || (statusFilter && statusFilter !== 'all'))
  const alertVariant = message?.type === 'error' ? 'destructive' : 'default'

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Gestion des membres</h2>
        <p className="text-muted-foreground">Consulter les inscriptions et approuver les documents.</p>
      </div>

      <RegistrationStats stats={stats} />

      <RegistrationFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
      />

      {message && (
        <Alert variant={alertVariant}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {registrations.length === 0 ? (
        <RegistrationEmptyState hasFilters={hasFilters} />
      ) : (
        <RegistrationList
          registrations={registrations}
          loadingId={actionLoadingId}
          onViewDocument={handleViewDocument}
          onOpenApproval={handleOpenApproval}
        />
      )}

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
        onReject={() => selectedRegistration && handleApproval(selectedRegistration, 'rejected', rejectionReason)}
      />
    </div>
  )
}
