import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { supabaseAdmin } from '@/lib/supabase/server'
import { buildTicketChangePreview } from '@/lib/admin/ticketChangePreview'

const paramsSchema = z.object({ id: z.string().uuid(), registrationId: z.string().uuid() })
const bodySchema = z.object({ ticketId: z.string().uuid() }).strict()

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string; registrationId: string }> }) {
  const parsedParams = paramsSchema.safeParse(await params)
  if (!parsedParams.success) return NextResponse.json({ error: 'Identifiants événement ou inscription invalides' }, { status: 400 })

  let body: unknown
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 }) }
  const parsedBody = bodySchema.safeParse(body)
  if (!parsedBody.success) return NextResponse.json({ error: 'Billet cible invalide' }, { status: 400 })

  const auth = await requireAdmin(request)
  if (!auth.ok) return auth.response

  const { id: eventId, registrationId } = parsedParams.data
  const admin = supabaseAdmin()
  const { data: registration, error: registrationError } = await admin.from('registrations').select('id, event_id, ticket_id, user_id, wave_index, start_time').eq('id', registrationId).eq('event_id', eventId).maybeSingle()
  if (registrationError) { console.error('[admin ticket preview] registration lookup error', registrationError); return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 }) }
  if (!registration) return NextResponse.json({ error: 'Inscription introuvable pour cet événement' }, { status: 404 })
  if (!registration.ticket_id) return NextResponse.json({ error: 'L’inscription ne possède pas de billet actuel' }, { status: 422 })

  const ticketIds = [registration.ticket_id, parsedBody.data.ticketId]
  const { data: tickets, error: ticketsError } = await admin.from('tickets').select('id, event_id, name, final_price_cents, currency, race:races(name)').in('id', ticketIds)
  if (ticketsError) { console.error('[admin ticket preview] ticket lookup error', ticketsError); return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 }) }
  const ticketById = new Map((tickets ?? []).map((ticket: any) => [ticket.id, ticket]))
  const current = ticketById.get(registration.ticket_id)
  const target = ticketById.get(parsedBody.data.ticketId)
  if (!current || !target) return NextResponse.json({ error: 'Billet actuel ou cible introuvable' }, { status: 404 })

  let group: any = null
  if (registration.user_id) {
    const { data: membership, error: groupError } = await admin.from('group_members').select('group:groups(name, anchor_event_id, anchor_wave_index, anchor_start_time)').eq('profile_id', registration.user_id).maybeSingle()
    if (groupError) { console.error('[admin ticket preview] group lookup error', groupError); return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 }) }
    const rawGroup = Array.isArray(membership?.group) ? membership.group[0] : membership?.group
    group = rawGroup ?? null
  }

  const preview = buildTicketChangePreview({
    currentTicket: { id: current.id, eventId: current.event_id, name: current.name, raceName: Array.isArray(current.race) ? current.race[0]?.name : current.race?.name, priceCents: current.final_price_cents, currency: current.currency },
    targetTicket: { id: target.id, eventId: target.event_id, name: target.name, raceName: Array.isArray(target.race) ? target.race[0]?.name : target.race?.name, priceCents: target.final_price_cents, currency: target.currency },
    registration: { eventId: registration.event_id, waveIndex: registration.wave_index, startTime: registration.start_time, userId: registration.user_id },
    group: group ? { name: group.name, anchorEventId: group.anchor_event_id, anchorWaveIndex: group.anchor_wave_index, anchorStartTime: group.anchor_start_time } : null,
  })
  return NextResponse.json({ preview })
}
