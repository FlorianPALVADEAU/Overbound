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
import { OFFICIAL_RULEBOOK_PDF_PATH } from '@/constants/registration'

interface RegistrationDetailsDialogProps {
  registration: AdminRegistration | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const formatAmount = (amount?: number | null, currency?: string | null) => {
  if (amount == null) return 'Non renseigné'
  return (amount / 100).toLocaleString('fr-FR', {
    style: 'currency',
    currency: (currency || 'EUR').toUpperCase(),
  })
}

const formatBoolean = (value?: boolean | null) => {
  if (value == null) return 'Non renseigné'
  return value ? 'Oui' : 'Non'
}

const statusLabel = (value?: string | null) => {
  if (!value) return 'Non renseigné'
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

const withFallback = (value?: string | null) => {
  if (!value || value.trim().length === 0) return 'Non renseigné'
  return value
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

const humanizeMetaKey = (key: string) =>
  key
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\w/, (char) => char.toUpperCase())

const renderUpsellMeta = (meta: unknown) => {
  if (!meta || typeof meta !== 'object') return [] as string[]
  const details: string[] = []
  for (const [key, value] of Object.entries(meta as Record<string, unknown>)) {
    if (value == null) continue
    if (key === 'sizes' && Array.isArray(value)) {
      const sizes = value.filter((item) => typeof item === 'string' && item.trim().length > 0)
      if (sizes.length > 0) details.push(`Tailles: ${sizes.join(', ')}`)
      continue
    }
    if (key === 'size' && typeof value === 'string' && value.trim().length > 0) {
      details.push(`Taille: ${value.trim()}`)
      continue
    }
    if (Array.isArray(value)) {
      details.push(`${humanizeMetaKey(key)}: ${value.map((item) => String(item)).join(', ')}`)
      continue
    }
    if (typeof value === 'object') continue
    details.push(`${humanizeMetaKey(key)}: ${String(value)}`)
  }
  return details
}

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
  const promotionalCodes = Array.isArray(registration.promotional_codes)
    ? registration.promotional_codes
    : []
  const upsellItems = Array.isArray(registration.upsell_items)
    ? registration.upsell_items
    : []
  const hasTshirt = Boolean(registration.has_tshirt)
  const tshirtSizes = Array.isArray(registration.tshirt_sizes) ? registration.tshirt_sizes : []

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
              <span className="font-mono text-xs break-all">{withFallback(registration.user_id)}</span>
            </div>
            <div className={rowClassName}>
              <span className="text-muted-foreground">Créée le</span>
              <span>{withFallback(formatDateTimeParis(registration.created_at))}</span>
            </div>
          </section>

          <Separator />

          <section className="space-y-2">
            <h4 className="font-semibold">Événement & billet</h4>
            <div className={rowClassName}>
              <span className="text-muted-foreground">Événement</span>
              <span>{withFallback(registration.event?.title)}</span>
            </div>
            <div className={rowClassName}>
              <span className="text-muted-foreground">Date événement</span>
              <span>{withFallback(formatDateTimeParis(registration.event?.date))}</span>
            </div>
            <div className={rowClassName}>
              <span className="text-muted-foreground">Lieu</span>
              <span>{withFallback(registration.event?.location)}</span>
            </div>
            <div className={rowClassName}>
              <span className="text-muted-foreground">Billet</span>
              <span>{withFallback(registration.ticket?.name)}</span>
            </div>
            <div className={rowClassName}>
              <span className="text-muted-foreground">Order ID</span>
              <span className="font-mono text-xs break-all">{withFallback(registration.order?.id)}</span>
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
            <h4 className="font-semibold">Commande complète</h4>
            <div className={rowClassName}>
              <span className="text-muted-foreground">Email commande</span>
              <span>{withFallback(registration.order?.email)}</span>
            </div>
            <div className={rowClassName}>
              <span className="text-muted-foreground">Provider</span>
              <span>{withFallback(registration.order?.provider)}</span>
            </div>
            <div className={rowClassName}>
              <span className="text-muted-foreground">Provider Order ID</span>
              <span className="font-mono text-xs break-all">{withFallback(registration.order?.provider_order_id)}</span>
            </div>
            <div className={rowClassName}>
              <span className="text-muted-foreground">Créée le</span>
              <span>{withFallback(formatDateTimeParis(registration.order?.created_at))}</span>
            </div>
            <div className={rowClassName}>
              <span className="text-muted-foreground">Montant total commande</span>
              <span>{formatAmount(registration.order?.amount_total, registration.order?.currency)}</span>
            </div>
            <div className={rowClassName}>
              <span className="text-muted-foreground">Montant par participant</span>
              <span>
                {formatAmount((registration.order as any)?.amount_per_registration, registration.order?.currency)}
              </span>
            </div>
            <div className={rowClassName}>
              <span className="text-muted-foreground">Participants commande</span>
              <span>{(registration.order as any)?.registrations_count ?? 'Non renseigné'}</span>
            </div>
            <div className={rowClassName}>
              <span className="text-muted-foreground">Facture</span>
              <span className="break-all">{withFallback(registration.order?.invoice_url)}</span>
            </div>
            <div className={rowClassName}>
              <span className="text-muted-foreground">Codes promo</span>
              <span className="flex flex-wrap gap-1">
                {promotionalCodes.length > 0 ? (
                  promotionalCodes.map((promo) => {
                    const discount = formatPromoDiscount(promo)
                    return (
                      <Badge key={promo.id} variant="outline" className="text-[11px]">
                        {promo.code}
                        {discount ? ` • ${discount}` : ''}
                      </Badge>
                    )
                  })
                ) : (
                  <span>Aucun code promo</span>
                )}
              </span>
            </div>
            <div className={rowClassName}>
              <span className="text-muted-foreground">T-shirt</span>
              <span>
                {hasTshirt
                  ? `Oui${
                      (registration.tshirt_quantity ?? 0) > 0 ? ` (x${registration.tshirt_quantity})` : ''
                    }${tshirtSizes.length > 0 ? ` • tailles ${tshirtSizes.join(', ')}` : ''}`
                  : 'Non'}
              </span>
            </div>
            <div className={rowClassName}>
              <span className="text-muted-foreground">Options upsell</span>
              <span className="space-y-1">
                {upsellItems.length > 0 ? (
                  upsellItems.map((item, index) => (
                    <div key={`${item.registration_id}-${item.name}-${index}`} className="rounded border border-border/50 px-2 py-1">
                      <p className="text-xs font-medium">
                        {item.quantity} × {item.name} — {formatAmount(item.price_cents, item.currency)} / unité
                      </p>
                      {renderUpsellMeta(item.meta).map((detail) => (
                        <p key={detail} className="text-[11px] text-muted-foreground">
                          {detail}
                        </p>
                      ))}
                    </div>
                  ))
                ) : (
                  <span>Aucune option</span>
                )}
              </span>
            </div>
          </section>

          <Separator />

          <section className="space-y-2">
            <h4 className="font-semibold">Départ & affectation</h4>
            <div className={rowClassName}>
              <span className="text-muted-foreground">Départ assigné (Paris)</span>
              <span>{withFallback(formatClockTimeParis(registration.start_time))}</span>
            </div>
            <div className={rowClassName}>
              <span className="text-muted-foreground">Start UTC</span>
              <span>{withFallback(registration.start_time)}</span>
            </div>
            <div className={rowClassName}>
              <span className="text-muted-foreground">Wave</span>
              <span>
                {registration.wave_index ?? 'Non assigné'}
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
                {formatClockTimeParis(registration.preferred_window_start) ?? 'Non renseigné'} →{' '}
                {formatClockTimeParis(registration.preferred_window_end) ?? 'Non renseigné'}
              </span>
            </div>
            <div className={rowClassName}>
              <span className="text-muted-foreground">Dernier départ autorisé</span>
              <span>{formatClockTimeParis(registration.latest_allowed_time) ?? 'Non renseigné'}</span>
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
              <span className="text-muted-foreground">Règlement officiel</span>
              <a href={OFFICIAL_RULEBOOK_PDF_PATH} target="_blank" rel="noreferrer" className="underline">
                Consulter le PDF
              </a>
            </div>
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
                  <span>Aucun document uploadé</span>
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
              <span>{withFallback(latestSignature?.regulation_version)}</span>
            </div>
            <div className={rowClassName}>
              <span className="text-muted-foreground">Dernière signature</span>
              <span>{withFallback(formatDateTimeParis(latestSignature?.signed_at))}</span>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}
