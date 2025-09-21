'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { AdminRegistration } from '@/types/Registration'
import { Calendar, CheckCircle, Clock, DollarSign, Eye, Filter, Ticket, XCircle } from 'lucide-react'

interface RegistrationCardProps {
  registration: AdminRegistration
  loadingId?: string | null
  onViewDocument: (registration: AdminRegistration) => void
  onOpenApproval: (registration: AdminRegistration) => void
}

function getStatusVariant(status: AdminRegistration['approval_status']) {
  switch (status) {
    case 'approved':
      return 'default' as const
    case 'pending':
      return 'secondary' as const
    case 'rejected':
      return 'destructive' as const
    default:
      return 'outline' as const
  }
}

function getStatusLabel(status: AdminRegistration['approval_status']) {
  switch (status) {
    case 'approved':
      return 'Approuvé'
    case 'pending':
      return 'En attente'
    case 'rejected':
      return 'Rejeté'
    default:
      return status
  }
}

function formatAmount(amount: number | null | undefined, currency: string | null | undefined) {
  if (amount === null || amount === undefined) return '—'
  const formatted = (amount / 100).toFixed(2)
  return `${formatted} ${(currency || 'EUR').toUpperCase()}`
}

export function RegistrationCard({ registration, loadingId, onViewDocument, onOpenApproval }: RegistrationCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="font-semibold truncate">{registration.email}</h3>
              <Badge variant={getStatusVariant(registration.approval_status)}>
                {getStatusLabel(registration.approval_status)}
              </Badge>
              {registration.checked_in && (
                <Badge variant="outline" className="text-blue-600 border-blue-200">
                  Présent
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              {registration.event && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{registration.event.title}</span>
                </div>
              )}

              {registration.ticket && (
                <div className="flex items-center gap-2">
                  <Ticket className="h-4 w-4 text-muted-foreground" />
                  <span>{registration.ticket.name}</span>
                </div>
              )}

              {registration.order && (
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span>{formatAmount(registration.order.amount_total, registration.order.currency)}</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>
                  {new Date(registration.created_at).toLocaleDateString('fr-FR')}
                </span>
              </div>
            </div>

            {registration.rejection_reason && (
              <p className="text-sm text-muted-foreground">
                Raison du rejet : {registration.rejection_reason}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            {registration.document_url && (
              <Button variant="outline" size="sm" onClick={() => onViewDocument(registration)}>
                <Eye className="h-4 w-4" />
              </Button>
            )}

            {registration.approval_status === 'pending' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenApproval(registration)}
                disabled={loadingId === registration.id}
              >
                {loadingId === registration.id ? (
                  <Clock className="h-4 w-4 animate-spin" />
                ) : (
                  <Filter className="h-4 w-4" />
                )}
              </Button>
            )}

            {registration.approval_status === 'approved' && registration.approved_at && (
              <div className="text-xs text-muted-foreground text-right">
                <CheckCircle className="inline-block h-3 w-3 mr-1" />
                Approuvé le {new Date(registration.approved_at).toLocaleDateString('fr-FR')}
              </div>
            )}

            {registration.approval_status === 'rejected' && registration.rejection_reason && (
              <div className="text-xs text-muted-foreground text-right">
                <XCircle className="inline-block h-3 w-3 mr-1" />
                Rejeté
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
