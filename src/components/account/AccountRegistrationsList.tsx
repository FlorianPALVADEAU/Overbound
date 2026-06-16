'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  CalendarIcon,
  Clock as ClockIcon,
  DownloadIcon,
  MapPinIcon,
  QrCodeIcon,
  Share2,
  AlertTriangle,
} from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FORMAT_LEVELS } from '@/constants/formatLevels'
import { formatClockTimeParis } from '@/lib/dateTime'
import { OFFICIAL_RULEBOOK_PDF_PATH } from '@/constants/registration'

export interface AccountRegistrationItem {
  registration_id: string
  user_id: string
  checked_in: boolean
  claim_status: string
  qr_code_token: string | null
  qr_code_data_url: string | null
  transfer_token: string | null
  created_at: string
  start_time?: string | null
  wave_index?: number | null
  wave_capacity?: number | null
  wave_position?: number | null
  auto_assigned?: boolean | null
  distance_ideal_km?: number | null
  distance_min_km?: number | null
  assignment_constraint_breached?: boolean | null
  ticket_id: string | null
  ticket_name: string | null
  difficulty_level: 'low' | 'mid' | 'hard' | null
  event_id: string | null
  event_title: string | null
  event_date: string | null
  event_location: string | null
  amount_total: number | null
  currency: string | null
  order_status: string | null
  invoice_url: string | null
  order_created_at: string | null
  approval_status: 'pending' | 'approved' | 'rejected'
  document_url: string | null
  requires_document: boolean
  document_requires_attention: boolean
  documents_count?: number
  required_documents_count?: number
  documents_complete?: boolean
  required_document_types?: string[]
  uploaded_document_types?: string[]
}

interface AccountRegistrationsListProps {
  registrations: AccountRegistrationItem[]
  heading?: string
}

export function AccountRegistrationsList({ registrations }: AccountRegistrationsListProps) {
  const [activeDialog, setActiveDialog] = useState<{ type: 'qr' | 'share'; id: string } | null>(
    null,
  )
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null)
  const [baseOrigin, setBaseOrigin] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setBaseOrigin(window.location.origin)
    }
  }, [])

  useEffect(() => {
    if (activeDialog?.type !== 'qr') {
      return
    }

    const originalFilter = document.documentElement.style.filter
    const originalBackground = document.body.style.backgroundColor

    document.documentElement.style.filter = 'brightness(1.15)'
    document.body.style.backgroundColor = '#000000'

    return () => {
      document.documentElement.style.filter = originalFilter
      document.body.style.backgroundColor = originalBackground
    }
  }, [activeDialog])

  useEffect(() => {
    if (!copiedLinkId) return
    const timeout = setTimeout(() => setCopiedLinkId(null), 2500)
    return () => clearTimeout(timeout)
  }, [copiedLinkId])

  const now = useMemo(() => new Date(), [])

  if (!registrations || registrations.length === 0) {
    return null
  }

  return (
    <div className="space-y-6">
      {registrations.map((registration, index) => {
        const eventDate = registration.event_date ? new Date(registration.event_date) : null
        const isUpcoming = eventDate ? eventDate > now : false
        const isPast = eventDate ? eventDate < now : false
        const formattedEventDate = eventDate
          ? eventDate.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
          : null
        const formattedOrderDate = registration.order_created_at
          ? new Date(registration.order_created_at).toLocaleDateString('fr-FR')
          : null
        const formattedStartTime = formatClockTimeParis(registration.start_time)

        const amountLabel =
          typeof registration.amount_total === 'number' && registration.currency
            ? `${(registration.amount_total / 100).toFixed(2)} ${registration.currency.toUpperCase()}`
            : null

        const shareUrl =
          registration.transfer_token && baseOrigin
            ? `${baseOrigin}/account/tickets/claim?token=${registration.transfer_token}`
            : ''

        const isQrDialogOpen =
          activeDialog?.type === 'qr' && activeDialog.id === registration.registration_id
        const isShareDialogOpen =
          activeDialog?.type === 'share' && activeDialog.id === registration.registration_id

        return (
          <div key={registration.registration_id}>
            <div className="flex flex-col gap-6 rounded-lg border bg-card p-6 lg:flex-row">
              <div className="flex h-32 w-full flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary/10 to-primary/20 lg:w-48">
                <img
                  src="/images/images/a-young-men-carrying-a-wooden-log-on-his-shoulder-staring-at-the-camera.avif"
                  alt="Participant Overbound"
                  className="h-full w-full rounded-lg object-cover"
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <h3 className="mb-1 text-xl font-semibold">
                      {registration.event_title || 'Événement'}
                    </h3>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-muted-foreground">{registration.ticket_name}</p>
                      {registration.difficulty_level && (
                        <Badge
                          variant="outline"
                          className={`text-xs ${FORMAT_LEVELS[registration.difficulty_level].badgeClass}`}
                        >
                          {FORMAT_LEVELS[registration.difficulty_level].name}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {registration.checked_in ? (
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        ✓ Présent
                      </Badge>
                    ) : isUpcoming ? (
                      <Badge variant="secondary">À venir</Badge>
                    ) : isPast ? (
                      <Badge variant="outline">Terminé</Badge>
                    ) : null}
                  </div>
                </div>

                <div className="mb-4 grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                {formattedEventDate ? (
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <span>Début de l'événement : {formattedEventDate}</span>
                  </div>
                ) : null}
                {formattedStartTime ? (
                  <div className="flex items-center gap-2">
                    <ClockIcon className="h-4 w-4 text-muted-foreground" />
                    <span>Départ prévu : {formattedStartTime}</span>
                  </div>
                ) : null}
                {registration.assignment_constraint_breached ? (
                  <div className="flex items-center gap-2 text-amber-700">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Créneau attribué hors préférence.</span>
                  </div>
                ) : null}
                  {registration.event_location ? (
                    <div className="flex items-center gap-2">
                      <MapPinIcon className="h-4 w-4 text-muted-foreground" />
                      <span>{registration.event_location}</span>
                    </div>
                  ) : null}
                </div>

                {amountLabel ? (
                  <div className="mb-4 rounded-lg bg-muted/30 p-3 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-4">
                        <span>
                          <strong>Prix :</strong> {amountLabel}
                        </span>
                        {registration.order_status ? (
                          <span>
                            <strong>Statut :</strong>{' '}
                            <Badge
                              variant={registration.order_status === 'paid' ? 'default' : 'secondary'}
                              className="ml-1"
                            >
                              {registration.order_status === 'paid'
                                ? 'Payé'
                                : registration.order_status}
                            </Badge>
                          </span>
                        ) : null}
                        {formattedOrderDate ? (
                          <span className="text-muted-foreground">{formattedOrderDate}</span>
                        ) : null}
                      </div>
                      {registration.invoice_url ? (
                        <Link href={registration.invoice_url} target="_blank">
                          <Button variant="outline" size="sm">
                            <DownloadIcon className="mr-1 h-4 w-4" />
                            Facture
                          </Button>
                        </Link>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-2">
                  <Link href={OFFICIAL_RULEBOOK_PDF_PATH} target="_blank">
                    <Button variant="ghost" size="sm">
                      Règlement officiel
                    </Button>
                  </Link>
                  <Dialog
                    open={isQrDialogOpen}
                    onOpenChange={(open) =>
                      setActiveDialog(
                        open ? { type: 'qr', id: registration.registration_id } : null,
                      )
                    }
                  >
                    {
                      !registration.checked_in && (
                        <DialogTrigger asChild>
                          <Button
                            variant="default"
                            size="sm"
                            disabled={!registration.qr_code_data_url || registration.checked_in || registration.claim_status === 'claimed' || !isUpcoming}
                          >
                            <QrCodeIcon className="mr-2 h-4 w-4" />
                            Voir le billet
                          </Button>
                        </DialogTrigger>
                      )
                    }
                    <DialogPortal>
                      <DialogOverlay className="bg-black/80 backdrop-blur-md" />
                      <DialogContent
                        className="border-none bg-transparent p-0 shadow-none outline-none focus-visible:outline-none"
                        showCloseButton={false}
                      >
                        <DialogHeader className="sr-only">
                          <DialogTitle>
                            Billet {registration.ticket_name || 'Overbound'} — {registration.event_title || 'Événement'}
                          </DialogTitle>
                          <DialogDescription>
                            Affiche le QR code de check-in pour ce billet.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="flex flex-col items-center gap-4 rounded-2xl bg-white p-6 text-center shadow-2xl">
                          <div className="text-sm font-medium text-muted-foreground">
                            Présente ce QR au check-in
                          </div>
                          {registration.qr_code_data_url ? (
                            <img
                              src={registration.qr_code_data_url}
                              alt="QR Code pour la validation du billet"
                              className="h-64 w-64 rounded-lg bg-white object-contain"
                            />
                          ) : (
                            <div className="flex h-64 w-64 items-center justify-center rounded-lg border border-dashed border-muted">
                              <p className="text-sm text-muted-foreground">QR code indisponible</p>
                            </div>
                          )}
                          <div className="space-y-1">
                            <p className="text-base font-semibold">{registration.event_title}</p>
                            <div className="flex items-center justify-center gap-2">
                              <p className="text-sm text-muted-foreground">{registration.ticket_name}</p>
                              {registration.difficulty_level && (
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${FORMAT_LEVELS[registration.difficulty_level].badgeClass}`}
                                >
                                  {FORMAT_LEVELS[registration.difficulty_level].name}
                                </Badge>
                              )}
                            </div>
                            {formattedEventDate ? (
                              <p className="text-xs text-muted-foreground">{formattedEventDate}</p>
                            ) : null}
                            {formattedStartTime ? (
                              <p className="text-xs text-muted-foreground">Départ prévu : {formattedStartTime}</p>
                            ) : null}
                          </div>
                          <Button variant="outline" className="w-full" onClick={() => setActiveDialog(null)}>
                            Fermer
                          </Button>
                        </div>
                      </DialogContent>
                    </DialogPortal>
                  </Dialog>

                  <Dialog
                    open={isShareDialogOpen}
                    onOpenChange={(open) =>
                      setActiveDialog(
                        open ? { type: 'share', id: registration.registration_id } : null,
                      )
                    }
                  >
                    {
                      !registration.checked_in && (
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={!registration.transfer_token || !registration.qr_code_data_url || registration.checked_in || registration.claim_status === 'claimed' || !isUpcoming}
                          >
                            <Share2 className="mr-2 h-4 w-4" />
                            Transférer
                          </Button>
                        </DialogTrigger>
                      )
                    }
                    <DialogContent className="sm:max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Partager ce billet</DialogTitle>
                        <DialogDescription>
                          Envoie ce lien à la personne qui récupèrera le billet. Elle devra être
                          connectée pour l&apos;affilier à son compte.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor={`share-link-${registration.registration_id}`}>
                            Lien de transfert
                          </Label>
                          <div className="flex flex-col gap-2 sm:flex-row">
                            <Input
                              id={`share-link-${registration.registration_id}`}
                              value={shareUrl}
                              readOnly
                              className="flex-1 font-mono text-xs"
                            />
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={async () => {
                                if (!shareUrl) return
                                try {
                                  await navigator.clipboard.writeText(shareUrl)
                                  setCopiedLinkId(registration.registration_id)
                                } catch (error) {
                                  console.error('Impossible de copier le lien', error)
                                }
                              }}
                            >
                              Copier
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Toute personne disposant de ce lien pourra réclamer le billet.
                          </p>
                          {copiedLinkId === registration.registration_id ? (
                            <p className="text-xs font-medium text-emerald-600">Lien copié !</p>
                          ) : null}
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setActiveDialog(null)}>
                          Fermer
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  {isUpcoming && registration.event_id ? (
                    <Link href={`/events/${registration.event_id}`}>
                      <Button variant="outline" size="sm">
                        Détails de l'événement
                      </Button>
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>
            {index < registrations.length - 1 ? <Separator className="my-6" /> : null}
          </div>
        )
      })}
    </div>
  )
}
