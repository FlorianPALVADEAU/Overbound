'use client'

import { useEffect, useMemo, useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Clock, Ticket, Users } from 'lucide-react'
import { useAdminTickets } from '@/app/api/admin/tickets/ticketsQueries'
import { useAdminEventWaves } from '@/app/api/admin/events/eventsQueries'
import {
  changeAdminRegistrationTicket,
  moveAdminRegistrationWave,
} from '@/app/api/admin/registrations/registrationsQueries'
import {
  getRegistrationTicketFormat,
  registrationTicketFormatLabel,
} from '@/lib/admin/registrationTicketChange'
import { formatClockTimeParis } from '@/lib/dateTime'
import type { AdminRegistration } from '@/types/Registration'

const SELECT_TICKET = '__select_ticket__'
const SELECT_WAVE = '__select_wave__'

interface RegistrationOperationsDialogProps {
  registration: AdminRegistration | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdated: () => Promise<void>
}

export function RegistrationOperationsDialog({
  registration,
  open,
  onOpenChange,
  onUpdated,
}: RegistrationOperationsDialogProps) {
  const { data: tickets = [], isLoading: ticketsLoading } = useAdminTickets()
  const { data: waves = [], isLoading: wavesLoading } = useAdminEventWaves(registration?.event_id)
  const [ticketId, setTicketId] = useState(SELECT_TICKET)
  const [waveIndex, setWaveIndex] = useState(SELECT_WAVE)
  const [saving, setSaving] = useState<'ticket' | 'wave' | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setTicketId(SELECT_TICKET)
    setWaveIndex(SELECT_WAVE)
    setSaving(null)
    setError(null)
  }, [open, registration?.id])

  const eventTickets = useMemo(
    () => tickets.filter((ticket) => ticket.event_id === registration?.event_id),
    [tickets, registration?.event_id],
  )
  const currentTicket = eventTickets.find((ticket) => ticket.id === registration?.ticket_id)
  const currentFormat = getRegistrationTicketFormat(
    currentTicket?.name ?? registration?.ticket?.name,
    currentTicket?.race?.name,
  )
  const selectedTicket = eventTickets.find((ticket) => ticket.id === ticketId)
  const selectedFormat = getRegistrationTicketFormat(selectedTicket?.name, selectedTicket?.race?.name)
  const isOpen = currentFormat === 'open'

  if (!registration) return null

  const saveTicket = async () => {
    if (!selectedTicket) return
    setSaving('ticket')
    setError(null)
    try {
      await changeAdminRegistrationTicket(registration.id, selectedTicket.id)
      await onUpdated()
      onOpenChange(false)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Impossible de changer le billet')
    } finally {
      setSaving(null)
    }
  }

  const saveWave = async () => {
    const targetWave = Number(waveIndex)
    if (!Number.isInteger(targetWave)) return
    setSaving('wave')
    setError(null)
    try {
      await moveAdminRegistrationWave(registration.id, targetWave)
      await onUpdated()
      onOpenChange(false)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Impossible de déplacer ce SAS')
    } finally {
      setSaving(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Gérer l&apos;inscription</DialogTitle>
          <DialogDescription>
            {registration.participant_profile?.full_name || registration.email} · {registration.event?.title ?? 'Événement'}
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>
        ) : null}

        <section className="space-y-3 rounded-lg border p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 font-medium"><Ticket className="h-4 w-4" /> Billet</div>
            <Badge variant="secondary">{registrationTicketFormatLabel(currentFormat)}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">Actuel : {registration.ticket?.name ?? 'Non renseigné'}</p>
          <Select value={ticketId} onValueChange={setTicketId} disabled={ticketsLoading || saving !== null}>
            <SelectTrigger><SelectValue placeholder="Choisir un nouveau billet" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={SELECT_TICKET}>Choisir un nouveau billet</SelectItem>
              {eventTickets.filter((ticket) => ticket.id !== registration.ticket_id).map((ticket) => {
                const format = getRegistrationTicketFormat(ticket.name, ticket.race?.name)
                return (
                  <SelectItem key={ticket.id} value={ticket.id} disabled={format === 'unknown'}>
                    {ticket.name} · {registrationTicketFormatLabel(format)}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
          {selectedTicket ? (
            <p className="text-xs text-muted-foreground">
              {selectedFormat === 'open'
                ? 'Un SAS OPEN sera attribué automatiquement. Une ancre de groupe existante reste prioritaire.'
                : 'Le participant partira à 08:00 et toutes les données de SAS seront retirées.'}
            </p>
          ) : null}
          <DialogFooter>
            <Button size="sm" onClick={saveTicket} disabled={!selectedTicket || saving !== null}>
              {saving === 'ticket' ? 'Mise à jour…' : 'Changer le billet'}
            </Button>
          </DialogFooter>
        </section>

        <section className="space-y-3 rounded-lg border p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 font-medium"><Clock className="h-4 w-4" /> SAS de départ</div>
            <span className="text-sm text-muted-foreground">
              {formatClockTimeParis(registration.start_time) ?? '—'}
            </span>
          </div>
          {isOpen ? (
            <>
              <Select value={waveIndex} onValueChange={setWaveIndex} disabled={wavesLoading || saving !== null}>
                <SelectTrigger><SelectValue placeholder="Déplacer vers un SAS" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={SELECT_WAVE}>Déplacer vers un SAS</SelectItem>
                  {waves.map((wave) => (
                    <SelectItem
                      key={wave.wave_index}
                      value={String(wave.wave_index)}
                      disabled={wave.is_closed || wave.assigned_count >= wave.capacity || wave.wave_index === registration.wave_index}
                    >
                      {formatClockTimeParis(wave.start_time)} · {wave.assigned_count}/{wave.capacity}
                      {wave.is_closed ? ' · fermé' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                <Users className="mr-1 inline h-3.5 w-3.5" /> Un membre d&apos;un groupe ancré doit être déplacé depuis le groupe, pour garder tout le monde sur le même SAS.
              </p>
              <DialogFooter>
                <Button size="sm" variant="outline" onClick={saveWave} disabled={waveIndex === SELECT_WAVE || saving !== null}>
                  {saving === 'wave' ? 'Déplacement…' : 'Déplacer le SAS'}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Le SAS se gère uniquement pour un billet OPEN.</p>
          )}
        </section>
      </DialogContent>
    </Dialog>
  )
}
