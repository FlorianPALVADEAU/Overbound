'use client'

import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { AlertCircle, Clock, Eye } from 'lucide-react'
import axiosClient from '@/app/api/axiosClient'
import { useAdminTickets } from '@/app/api/admin/tickets/ticketsQueries'
import type { EventParticipantRow } from '@/app/api/admin/events/participantsQueries'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type TicketChangePreview = {
  allowed: boolean
  current: { ticketId: string; name: string; format: string; waveIndex: number | null; startTime: string | null }
  target: { ticketId: string; name: string; format: string; waveIndex: number | null; startTime: string | null }
  impacts: {
    format: 'unchanged' | 'changed'
    sas: string
    group: string
    financial: { status: 'no_change' | 'potential_change' | 'unknown'; currentPriceCents: number | null; targetPriceCents: number | null; currency: string | null }
  }
  warnings: string[]
  blockers: string[]
}

interface TicketChangePreviewPanelProps {
  eventId: string
  participant: EventParticipantRow
}

const impactLabels: Record<string, string> = {
  unchanged: 'Inchangé',
  changed: 'Modifié',
  cleared: 'Retirée',
  requires_assignment: 'À recalculer',
  assigned: 'Attribuée',
  not_applicable: 'Non applicable',
  unknown: 'À vérifier',
  none: 'Aucun',
  preserved: 'Conservé',
  anchor_applies: 'Ancre du groupe appliquée',
  no_change: 'Aucun changement de montant',
  potential_change: 'Impact financier possible',
}

const formatAmount = (cents: number | null, currency: string | null) =>
  cents == null ? 'Non renseigné' : new Intl.NumberFormat('fr-FR', { style: 'currency', currency: currency?.toUpperCase() ?? 'EUR' }).format(cents / 100)

type TicketChangeConfirmationGateProps = {
  previewAllowed: boolean
  financialStatus: TicketChangePreview['impacts']['financial']['status']
  reason: string
  onReasonChange: (reason: string) => void
}

/**
 * The confirmation endpoint intentionally returns 501 until the audit and
 * idempotency contract is deployed. Keep the UI explicit and inert here:
 * typing a reason is only preparation and must never imply a mutation.
 */
export function TicketChangeConfirmationGate({
  previewAllowed,
  financialStatus,
  reason,
  onReasonChange,
}: TicketChangeConfirmationGateProps) {
  const needsExceptionReason = previewAllowed && financialStatus !== 'no_change'

  return (
    <div className="space-y-2">
      {needsExceptionReason ? (
        <div className="space-y-1">
          <label htmlFor="ticket-change-exception-reason" className="text-xs font-medium">
            Motif de l’exception (préparation uniquement)
          </label>
          <Textarea
            id="ticket-change-exception-reason"
            value={reason}
            onChange={(event) => onReasonChange(event.target.value)}
            placeholder="Expliquez pourquoi le prix historique doit être conservé…"
            rows={2}
          />
          <p className="text-xs text-muted-foreground">Ce motif n’est pas encore envoyé au serveur.</p>
        </div>
      ) : null}
      <Alert aria-label="Confirmation indisponible">
        <AlertCircle className="h-4 w-4" aria-hidden="true" />
        <AlertDescription>
          <p className="font-medium">Confirmation indisponible</p>
          <p>Le contrat d’audit et d’idempotence n’est pas encore déployé.</p>
          <p>Aucune modification n’a été effectuée.</p>
        </AlertDescription>
      </Alert>
      <Button
        type="button"
        disabled
        className="w-full"
        title="NO_MOVEMENT_CONFIRMATION_CONTRACT_MISSING"
        aria-describedby="ticket-change-confirmation-unavailable"
      >
        Confirmation désactivée
      </Button>
      <span id="ticket-change-confirmation-unavailable" className="sr-only">
        NO_MOVEMENT_CONFIRMATION_CONTRACT_MISSING
      </span>
    </div>
  )
}

export function TicketChangePreviewPanel({ eventId, participant }: TicketChangePreviewPanelProps) {
  const { data: tickets = [], isLoading: ticketsLoading } = useAdminTickets()
  const eventTickets = useMemo(() => tickets.filter((ticket) => ticket.event_id === eventId), [eventId, tickets])
  const [targetTicketId, setTargetTicketId] = useState('')
  const [preview, setPreview] = useState<TicketChangePreview | null>(null)
  const [exceptionReason, setExceptionReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setTargetTicketId('')
    setPreview(null)
    setExceptionReason('')
    setError(null)
  }, [participant.id])

  const targetTickets = eventTickets.filter((ticket) => ticket.id !== participant.ticket.id)

  const requestPreview = async () => {
    if (!targetTicketId || !participant.ticket.id) return
    setLoading(true)
    setError(null)
    setPreview(null)
    try {
      const response = await axiosClient.post<{ preview: TicketChangePreview }>(
        `/admin/events/${eventId}/participants/${participant.id}/change-ticket/preview`,
        { ticketId: targetTicketId },
      )
      setPreview(response.data.preview)
    } catch (requestError) {
      const message = axios.isAxiosError(requestError)
        ? (requestError.response?.data as { error?: string } | undefined)?.error
        : null
      setError(message || 'Impossible de générer l’aperçu du changement.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="space-y-3 rounded-lg border bg-muted/20 p-4" aria-labelledby="ticket-preview-title">
      <div className="flex items-start gap-2">
        <Eye className="mt-0.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <div>
          <h3 id="ticket-preview-title" className="font-medium">Prévisualiser un changement de billet</h3>
          <p className="text-xs text-muted-foreground">Aucune donnée ne sera modifiée. La confirmation sera disponible après validation de la politique financière.</p>
        </div>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Select value={targetTicketId} onValueChange={(value) => { setTargetTicketId(value); setPreview(null); setError(null) }} disabled={ticketsLoading || targetTickets.length === 0}>
          <SelectTrigger aria-label="Billet cible" className="min-w-0 flex-1"><SelectValue placeholder={ticketsLoading ? 'Chargement des billets…' : targetTickets.length ? 'Choisir un billet cible' : 'Aucun autre billet disponible'} /></SelectTrigger>
          <SelectContent>
            {targetTickets.map((ticket) => <SelectItem key={ticket.id} value={ticket.id}>{ticket.name} · {ticket.currency?.toUpperCase() ?? 'EUR'} {formatAmount(ticket.final_price_cents, ticket.currency)}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button type="button" variant="outline" onClick={requestPreview} disabled={!targetTicketId || !participant.ticket.id || loading}>
          {loading ? <Clock className="mr-2 h-4 w-4 animate-spin" /> : <Eye className="mr-2 h-4 w-4" />}
          {loading ? 'Analyse…' : 'Prévisualiser'}
        </Button>
      </div>
      {error ? <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert> : null}
      {preview ? (
        <div className="space-y-3 rounded-md border bg-background p-3 text-sm">
          <div className="grid gap-2 sm:grid-cols-2">
            <div><p className="text-xs text-muted-foreground">Billet actuel</p><p>{preview.current.name} · {preview.current.format}</p></div>
            <div><p className="text-xs text-muted-foreground">Billet cible</p><p>{preview.target.name} · {preview.target.format}</p></div>
          </div>
          <div className="flex flex-wrap gap-2" aria-label="Impacts du changement">
            <Badge variant={preview.impacts.format === 'changed' ? 'secondary' : 'outline'}>Format : {impactLabels[preview.impacts.format] ?? preview.impacts.format}</Badge>
            <Badge variant="outline">SAS : {impactLabels[preview.impacts.sas] ?? preview.impacts.sas}</Badge>
            <Badge variant="outline">Groupe : {impactLabels[preview.impacts.group] ?? preview.impacts.group}</Badge>
            <Badge variant={preview.impacts.financial.status === 'no_change' ? 'outline' : 'secondary'}>Finance : {impactLabels[preview.impacts.financial.status] ?? preview.impacts.financial.status}</Badge>
          </div>
          {preview.impacts.financial.status !== 'no_change' ? <p className="text-xs text-muted-foreground">Montant actuel : {formatAmount(preview.impacts.financial.currentPriceCents, preview.impacts.financial.currency)} · cible : {formatAmount(preview.impacts.financial.targetPriceCents, preview.impacts.financial.currency)}</p> : null}
          {preview.blockers.length > 0 ? <div className="space-y-1 text-sm text-destructive"><p className="font-medium">Changement bloqué</p>{preview.blockers.map((blocker) => <p key={blocker}>• {blocker}</p>)}</div> : null}
          {preview.warnings.length > 0 ? <div className="space-y-1 text-sm text-amber-700 dark:text-amber-400"><p className="font-medium">Points d’attention</p>{preview.warnings.map((warning) => <p key={warning}>• {warning}</p>)}</div> : null}
          <TicketChangeConfirmationGate
            previewAllowed={preview.allowed}
            financialStatus={preview.impacts.financial.status}
            reason={exceptionReason}
            onReasonChange={setExceptionReason}
          />
        </div>
      ) : null}
    </section>
  )
}
