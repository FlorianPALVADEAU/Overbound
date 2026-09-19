'use client'

import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { AlertCircle, CheckCircle, Clock, Eye } from 'lucide-react'
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

type TicketChangeConfirmation = {
  previewId: string
  previewExpiresAt: string
  eventStartsAt: string
  eventTimezone: string
  expectedTicketId: string
  expectedWaveIndex: number | null
  expectedStartTime: string | null
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
  eventId: string
  registrationId: string
  targetTicketId: string
  confirmation: TicketChangeConfirmation
  previewAllowed: boolean
  financialStatus: TicketChangePreview['impacts']['financial']['status']
  reason: string
  onReasonChange: (reason: string) => void
}

export function TicketChangeConfirmationGate({
  eventId,
  registrationId,
  targetTicketId,
  confirmation,
  previewAllowed,
  financialStatus,
  reason,
  onReasonChange,
}: TicketChangeConfirmationGateProps) {
  const needsExceptionReason = previewAllowed && financialStatus !== 'no_change'
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const confirm = async () => {
    setSubmitting(true)
    setSubmitError(null)
    try {
      const response = await axiosClient.post(`/admin/events/${eventId}/participants/${registrationId}/change-ticket/confirm`, {
        commandId: crypto.randomUUID(),
        previewId: confirmation.previewId,
        previewSourceVersion: confirmation.previewId,
        currentSourceVersion: confirmation.previewId,
        policyVariant: 'NO_MOVEMENT',
        reason: reason.trim() || 'Correction opérationnelle sans mouvement financier',
        previewExpiresAt: confirmation.previewExpiresAt,
        eventStartsAt: confirmation.eventStartsAt,
        eventTimezone: confirmation.eventTimezone,
        targetTicketId,
        expectedTicketId: confirmation.expectedTicketId,
        expectedWaveIndex: confirmation.expectedWaveIndex,
        expectedStartTime: confirmation.expectedStartTime,
      })
      if (response.status === 200) setSubmitted(true)
    } catch (requestError) {
      const message = axios.isAxiosError(requestError)
        ? (requestError.response?.data as { error?: string } | undefined)?.error
        : null
      setSubmitError(message || 'La confirmation a échoué. Aucune modification fiable n’a été confirmée.')
    } finally {
      setSubmitting(false)
    }
  }

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
      {submitted ? (
        <Alert aria-label="Changement confirmé">
          <CheckCircle className="h-4 w-4 text-emerald-600" aria-hidden="true" />
          <AlertDescription>Le billet a été changé. Le prix historique a été conservé et l’opération a été auditée.</AlertDescription>
        </Alert>
      ) : null}
      {submitError ? <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{submitError}</AlertDescription></Alert> : null}
      {!submitted && previewAllowed && financialStatus === 'no_change' ? (
        <Alert aria-label="Confirmation disponible">
          <CheckCircle className="h-4 w-4 text-emerald-600" aria-hidden="true" />
          <AlertDescription>
            <p className="font-medium">Aucun mouvement financier</p>
            <p>Le prix historique sera conservé. La commande sera journalisée et rejouable sans doublon.</p>
          </AlertDescription>
        </Alert>
      ) : null}
      {!submitted ? <Button type="button" disabled={!previewAllowed || financialStatus !== 'no_change' || submitting} className="w-full" onClick={confirm}>
        {submitting ? <Clock className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
        {submitting ? 'Confirmation…' : 'Confirmer sans mouvement financier'}
      </Button> : null}
    </div>
  )
}

export function TicketChangePreviewPanel({ eventId, participant }: TicketChangePreviewPanelProps) {
  const { data: tickets = [], isLoading: ticketsLoading } = useAdminTickets()
  const eventTickets = useMemo(() => tickets.filter((ticket) => ticket.event_id === eventId), [eventId, tickets])
  const [targetTicketId, setTargetTicketId] = useState('')
  const [preview, setPreview] = useState<TicketChangePreview | null>(null)
  const [confirmation, setConfirmation] = useState<TicketChangeConfirmation | null>(null)
  const [exceptionReason, setExceptionReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setTargetTicketId('')
    setPreview(null)
    setExceptionReason('')
    setConfirmation(null)
    setError(null)
  }, [participant.id])

  const targetTickets = eventTickets.filter((ticket) => ticket.id !== participant.ticket.id)

  const requestPreview = async () => {
    if (!targetTicketId || !participant.ticket.id) return
    setLoading(true)
    setError(null)
    setPreview(null)
    try {
      const response = await axiosClient.post<{ preview: TicketChangePreview; confirmation: TicketChangeConfirmation }>(
        `/admin/events/${eventId}/participants/${participant.id}/change-ticket/preview`,
        { ticketId: targetTicketId },
      )
      setPreview(response.data.preview)
      setConfirmation(response.data.confirmation)
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
          <p className="text-xs text-muted-foreground">Aucune donnée ne sera modifiée avant votre confirmation. Les écarts financiers restent bloqués en V1.</p>
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
          {confirmation ? <TicketChangeConfirmationGate
            eventId={eventId}
            registrationId={participant.id}
            targetTicketId={targetTicketId}
            confirmation={confirmation}
            previewAllowed={preview.allowed}
            financialStatus={preview.impacts.financial.status}
            reason={exceptionReason}
            onReasonChange={setExceptionReason}
          /> : null}
        </div>
      ) : null}
    </section>
  )
}
