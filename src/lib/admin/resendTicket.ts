import type { SupabaseClient } from '@supabase/supabase-js'
import { formatProfileName } from '@/lib/account/profile'

type Admin = Pick<SupabaseClient, 'from'>

export type ResendTicketErrorCode = 'NOT_FOUND' | 'CANCELLED' | 'NO_QR' | 'SEND_FAILED'

const STATUS: Record<ResendTicketErrorCode, number> = { NOT_FOUND: 404, CANCELLED: 409, NO_QR: 409, SEND_FAILED: 502 }
const MESSAGE: Record<ResendTicketErrorCode, string> = {
  NOT_FOUND: 'Inscription introuvable.',
  CANCELLED: 'Cette inscription est annulée : son billet n’est plus valable.',
  NO_QR: 'Ce billet n’a pas de QR code.',
  SEND_FAILED: 'L’e-mail n’a pas pu être envoyé.',
}

export class ResendTicketError extends Error {
  readonly status: number
  constructor(readonly code: ResendTicketErrorCode) {
    super(MESSAGE[code])
    this.status = STATUS[code]
  }
}

export interface TicketEmailPayload {
  to: string
  participantName: string
  eventTitle: string
  eventDate: string
  eventLocation: string
  ticketName: string
  startTime?: string | null
  waveIndex?: number | null
  bibNumber?: number | null
  qrUrl: string
  manageUrl: string
}

const firstRelation = <T,>(value: T | T[] | null | undefined): T | null =>
  Array.isArray(value) ? (value[0] ?? null) : (value ?? null)

/** Sends the participant's ticket e-mail again, from what is stored now (SAS, bib and QR included). */
export async function resendRegistrationTicket(params: {
  admin: Admin
  registrationId: string
  siteUrl: string
  resolveQrUrl: (token: string, siteUrl: string) => Promise<string>
  formatStartTime: (startTime: string | null | undefined) => string | null | undefined
  send: (payload: TicketEmailPayload) => Promise<{ error?: unknown } | unknown>
}): Promise<{ to: string }> {
  const { admin, registrationId, siteUrl } = params

  const { data: registration, error } = await admin
    .from('registrations')
    .select(
      'id, email, user_id, qr_code_token, cancelled_at, start_time, wave_index, bib_number, event:events(title, date, location), ticket:tickets(name), profile:profiles(first_name, last_name)',
    )
    .eq('id', registrationId)
    .maybeSingle()
  if (error) throw error
  if (!registration) throw new ResendTicketError('NOT_FOUND')
  if (registration.cancelled_at) throw new ResendTicketError('CANCELLED')
  if (!registration.qr_code_token) throw new ResendTicketError('NO_QR')

  const event = firstRelation<{ title: string | null; date: string | null; location: string | null }>(registration.event)
  const ticket = firstRelation<{ name: string | null }>(registration.ticket)
  const profile = firstRelation<{ first_name: string | null; last_name: string | null }>(registration.profile)

  const qrUrl = await params.resolveQrUrl(registration.qr_code_token as string, siteUrl)
  const result = await params.send({
    to: registration.email as string,
    participantName: formatProfileName(profile) ?? 'Athlète',
    eventTitle: event?.title ?? 'Overbound',
    eventDate: event?.date
      ? new Date(event.date).toLocaleDateString('fr-FR', { dateStyle: 'full', timeZone: 'Europe/Paris' })
      : '',
    eventLocation: event?.location ?? '',
    ticketName: ticket?.name ?? 'Billet',
    startTime: params.formatStartTime(registration.start_time as string | null),
    waveIndex: registration.wave_index as number | null,
    bibNumber: registration.bib_number as number | null,
    qrUrl,
    manageUrl: `${siteUrl}/account/tickets?ticket=${registration.id}`,
  })
  if (result && typeof result === 'object' && 'error' in result && result.error) {
    console.error('[admin resend ticket] provider error', result.error)
    throw new ResendTicketError('SEND_FAILED')
  }
  return { to: registration.email as string }
}
