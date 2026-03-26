'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { AdminRegistration } from '@/types/Registration'
import { formatClockTimeParis, formatDateTimeParis } from '@/lib/dateTime'

interface RegistrationDetailsDialogProps {
  registration: AdminRegistration | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const formatAmount = (amount?: number | null, currency?: string | null) => {
  if (amount == null) return '—'
  return (amount / 100).toLocaleString('fr-FR', {
    style: 'currency',
    currency: (currency || 'EUR').toUpperCase(),
  })
}

const formatBoolean = (value?: boolean | null) => {
  if (value == null) return '—'
  return value ? 'Oui' : 'Non'
}

const statusLabel = (value?: string | null) => {
  if (!value) return '—'
  const lookup: Record<string, string> = {
    pending: 'En attente',
    approved: 'Approuvé',
    rejected: 'Rejeté',
    paid: 'Payé',
    unpaid: 'Impayé',
    transferred: 'Transféré',
  }
  return lookup[value] || value
}

const rowClassName = 'grid grid-cols-1 gap-1 text-sm sm:grid-cols-[220px_1fr]'

export function RegistrationDetailsDialog({
  registration,
  open,
  onOpenChange,
}: RegistrationDetailsDialogProps) {
  if (!registration) return null

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
  const participantName = isSharedOrder
    ? (emailDerivedName || registration.participant_profile?.full_name?.trim() || 'Nom non renseigné')
    : (registration.participant_profile?.full_name?.trim() || emailDerivedName || 'Nom non renseigné')

  const signatures = Array.isArray(registration.signatures) ? registration.signatures : []
  const latestSignature = signatures[0] ?? null
  const uploadedTypes = Array.isArray(registration.uploaded_document_types)
    ? registration.uploaded_document_types
    : []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[86vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Détails membre</DialogTitle>
          <DialogDescription>
            {participantName} • {registration.email}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <section className="space-y-2">
            <h4 className="font-semibold">Identité</h4>
            <div className={rowClassName}>
              <span className="text-muted-foreground">Nom</span>
              <span>{participantName}</span>
            </div>
            <div className={rowClassName}>
              <span className="text-muted-foreground">Email</span>
              <span>{registration.email}</span>
            </div>
            <div className={rowClassName}>
              <span className="text-muted-foreground">Registration ID</span>
              <span className="font-mono text-xs break-all">{registration.id}</span>
            </div>
            <div className={rowClassName}>
              <span className="text-muted-foreground">User ID</span>
              <span className="font-mono text-xs break-all">{registration.user_id ?? '—'}</span>
            </div>
            <div className={rowClassName}>
              <span className="text-muted-foreground">Créée le</span>
              <span>{formatDateTimeParis(registration.created_at) ?? '—'}</span>
            </div>
          </section>

          <Separator />

          <section className="space-y-2">
            <h4 className="font-semibold">Événement & billet</h4>
            <div className={rowClassName}>
              <span className="text-muted-foreground">Événement</span>
              <span>{registration.event?.title ?? '—'}</span>
            </div>
            <div className={rowClassName}>
              <span className="text-muted-foreground">Date événement</span>
              <span>{formatDateTimeParis(registration.event?.date) ?? '—'}</span>
            </div>
            <div className={rowClassName}>
              <span className="text-muted-foreground">Lieu</span>
              <span>{registration.event?.location ?? '—'}</span>
            </div>
            <div className={rowClassName}>
              <span className="text-muted-foreground">Billet</span>
              <span>{registration.ticket?.name ?? '—'}</span>
            </div>
            <div className={rowClassName}>
              <span className="text-muted-foreground">Order ID</span>
              <span className="font-mono text-xs break-all">{registration.order?.id ?? '—'}</span>
            </div>
            <div className={rowClassName}>
              <span className="text-muted-foreground">Paiement</span>
              <span>
                {formatAmount(
                  (registration.order as any)?.amount_per_registration ??
                    registration.order?.amount_total ??
                    null,
                  registration.order?.currency ?? null
                )}{' '}
                ({statusLabel(registration.order?.status)})
              </span>
            </div>
          </section>

          <Separator />

          <section className="space-y-2">
            <h4 className="font-semibold">Départ & affectation</h4>
            <div className={rowClassName}>
              <span className="text-muted-foreground">Départ assigné (Paris)</span>
              <span>{formatClockTimeParis(registration.start_time) ?? '—'}</span>
            </div>
            <div className={rowClassName}>
              <span className="text-muted-foreground">Start UTC</span>
              <span>{registration.start_time ?? '—'}</span>
            </div>
            <div className={rowClassName}>
              <span className="text-muted-foreground">Wave</span>
              <span>
                {registration.wave_index ?? '—'}
                {registration.wave_position ? ` • position ${registration.wave_position}` : ''}
                {registration.wave_capacity ? ` / ${registration.wave_capacity}` : ''}
              </span>
            </div>
            <div className={rowClassName}>
              <span className="text-muted-foreground">Auto-assigné</span>
              <span>{formatBoolean(registration.auto_assigned)}</span>
            </div>
            <div className={rowClassName}>
              <span className="text-muted-foreground">Fenêtre préférée</span>
              <span>
                {formatClockTimeParis(registration.preferred_window_start) ?? '—'} →{' '}
                {formatClockTimeParis(registration.preferred_window_end) ?? '—'}
              </span>
            </div>
            <div className={rowClassName}>
              <span className="text-muted-foreground">Dernier départ autorisé</span>
              <span>{formatClockTimeParis(registration.latest_allowed_time) ?? '—'}</span>
            </div>
            <div className={rowClassName}>
              <span className="text-muted-foreground">Contrainte dépassée</span>
              <span>{formatBoolean(registration.assignment_constraint_breached)}</span>
            </div>
          </section>

          <Separator />

          <section className="space-y-2">
            <h4 className="font-semibold">Validation & documents</h4>
            <div className={rowClassName}>
              <span className="text-muted-foreground">Statut inscription</span>
              <span>{statusLabel(registration.approval_status)}</span>
            </div>
            <div className={rowClassName}>
              <span className="text-muted-foreground">Check-in</span>
              <span>{formatBoolean(registration.checked_in)}</span>
            </div>
            <div className={rowClassName}>
              <span className="text-muted-foreground">Claim status</span>
              <span>{statusLabel(registration.claim_status)}</span>
            </div>
            <div className={rowClassName}>
              <span className="text-muted-foreground">Documents requis</span>
              <span>{formatBoolean(registration.requires_document)}</span>
            </div>
            <div className={rowClassName}>
              <span className="text-muted-foreground">Documents reçus</span>
              <span>
                {(registration.documents_count ?? 0)}/{registration.required_documents_count ?? 0}
              </span>
            </div>
            <div className={rowClassName}>
              <span className="text-muted-foreground">Types uploadés</span>
              <span className="flex flex-wrap gap-1">
                {uploadedTypes.length > 0 ? (
                  uploadedTypes.map((value) => (
                    <Badge key={value} variant="outline" className="text-[11px]">
                      {value}
                    </Badge>
                  ))
                ) : (
                  <span>—</span>
                )}
              </span>
            </div>
          </section>

          <Separator />

          <section className="space-y-2">
            <h4 className="font-semibold">Signature</h4>
            <div className={rowClassName}>
              <span className="text-muted-foreground">Signatures enregistrées</span>
              <span>{signatures.length}</span>
            </div>
            <div className={rowClassName}>
              <span className="text-muted-foreground">Dernière version règlement</span>
              <span>{latestSignature?.regulation_version ?? '—'}</span>
            </div>
            <div className={rowClassName}>
              <span className="text-muted-foreground">Dernière signature</span>
              <span>{formatDateTimeParis(latestSignature?.signed_at) ?? '—'}</span>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}
