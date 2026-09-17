import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { supabaseAdmin } from '@/lib/supabase/server'
import { isOpenFormatTicket } from '@/lib/openSas'
import { getEventCorrectionCutoff } from '@/lib/admin/eventCorrectionCutoff'

const paramsSchema = z.object({
  id: z.string().uuid(),
  registrationId: z.string().uuid(),
})

const bodySchema = z.object({
  waveIndex: z.number().int().min(1).max(24),
}).strict()

type WavePreview = {
  allowed: boolean
  registration: {
    id: string
    eventId: string
    ticketId: string
    format: 'OPEN'
    currentWaveIndex: number | null
    currentStartTime: string | null
  }
  target: {
    waveIndex: number
    startTime: string
    capacity: number
    assignedCount: number
    remainingCapacity: number
    isClosed: boolean
  }
  impacts: {
    departure: 'changed' | 'unchanged'
    group: 'none' | 'anchor_applies' | 'blocked_by_anchor'
    waveCounters: 'would_refresh'
  }
  warnings: string[]
  blockers: string[]
}

const errorResponse = (message: string, status: number) => NextResponse.json({ error: message }, { status })

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; registrationId: string }> },
) {
  const parsedParams = paramsSchema.safeParse(await params)
  if (!parsedParams.success) return errorResponse('Identifiants événement ou inscription invalides', 400)

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse('Corps JSON invalide', 400)
  }

  const parsedBody = bodySchema.safeParse(body)
  if (!parsedBody.success) return errorResponse('SAS cible invalide', 400)

  const auth = await requireAdmin(request)
  if (!auth.ok) return auth.response

  const { id: eventId, registrationId } = parsedParams.data
  const targetWaveIndex = parsedBody.data.waveIndex
  const admin = supabaseAdmin()
  const { data: event, error: eventError } = await admin
    .from('events')
    .select('date')
    .eq('id', eventId)
    .maybeSingle()

  if (eventError) {
    console.error('[admin wave preview] event lookup error', eventError)
    return errorResponse('Erreur serveur', 500)
  }
  if (!event) return errorResponse('Événement introuvable', 404)
  const cutoff = getEventCorrectionCutoff({ eventStart: event.date })

  const { data: registration, error: registrationError } = await admin
    .from('registrations')
    .select('id, event_id, ticket_id, user_id, wave_index, start_time')
    .eq('id', registrationId)
    .eq('event_id', eventId)
    .maybeSingle()

  if (registrationError) {
    console.error('[admin wave preview] registration lookup error', registrationError)
    return errorResponse('Erreur serveur', 500)
  }
  if (!registration) return errorResponse('Inscription introuvable pour cet événement', 404)
  if (!registration.ticket_id) return errorResponse('L’inscription ne possède pas de billet actuel', 422)

  const { data: ticket, error: ticketError } = await admin
    .from('tickets')
    .select('id, name, race:races(name)')
    .eq('id', registration.ticket_id)
    .eq('event_id', eventId)
    .maybeSingle()

  if (ticketError) {
    console.error('[admin wave preview] ticket lookup error', ticketError)
    return errorResponse('Erreur serveur', 500)
  }
  if (!ticket) return errorResponse('Billet actuel introuvable pour cet événement', 404)

  const race = ticket.race as { name?: string | null } | Array<{ name?: string | null }> | null
  const raceName = Array.isArray(race) ? race[0]?.name : race?.name
  if (!isOpenFormatTicket(ticket.name, raceName)) {
    return errorResponse('Seules les inscriptions OPEN peuvent changer de SAS', 422)
  }

  const { data: targetWave, error: targetWaveError } = await admin
    .from('event_waves')
    .select('wave_index, start_time, capacity, assigned_count, is_closed')
    .eq('event_id', eventId)
    .eq('wave_index', targetWaveIndex)
    .maybeSingle()

  if (targetWaveError) {
    console.error('[admin wave preview] target wave lookup error', targetWaveError)
    return errorResponse('Erreur serveur', 500)
  }
  if (!targetWave) return errorResponse('SAS cible introuvable pour cet événement', 404)

  let group: { name: string | null; anchor_event_id: string | null; anchor_wave_index: number | null } | null = null
  if (registration.user_id) {
    const { data: membership, error: groupError } = await admin
      .from('group_members')
      .select('group:groups(name, anchor_event_id, anchor_wave_index)')
      .eq('profile_id', registration.user_id)
      .maybeSingle()

    if (groupError) {
      console.error('[admin wave preview] group lookup error', groupError)
      return errorResponse('Erreur serveur', 500)
    }

    const rawGroup = Array.isArray(membership?.group) ? membership.group[0] : membership?.group
    group = rawGroup ?? null
  }

  const blockers: string[] = []
  const warnings: string[] = []
  if (!cutoff.allowed && cutoff.blocker) blockers.push(cutoff.blocker)
  const anchorApplies = Boolean(
    group && group.anchor_event_id === eventId && group.anchor_wave_index !== null,
  )
  const anchorWaveIndex = anchorApplies ? group?.anchor_wave_index ?? null : null
  const sameWave = registration.wave_index === targetWave.wave_index
  const remainingCapacity = Math.max(0, targetWave.capacity - targetWave.assigned_count)

  if (sameWave) blockers.push('L’inscription est déjà affectée à cette SAS.')
  if (targetWave.is_closed) blockers.push('La SAS cible est fermée.')
  if (targetWave.assigned_count >= targetWave.capacity) blockers.push('La SAS cible est pleine.')
  if (anchorApplies && anchorWaveIndex !== targetWave.wave_index) {
    blockers.push(`L’ancre du groupe « ${group?.name ?? 'sans nom'} » impose la SAS ${anchorWaveIndex}.`)
  }
  if (anchorApplies && anchorWaveIndex === targetWave.wave_index) {
    warnings.push(`L’ancre du groupe « ${group?.name ?? 'sans nom'} » impose cette SAS à l’inscription.`)
  }

  const preview: WavePreview = {
    allowed: blockers.length === 0,
    registration: {
      id: registration.id,
      eventId: registration.event_id,
      ticketId: registration.ticket_id,
      format: 'OPEN',
      currentWaveIndex: registration.wave_index,
      currentStartTime: registration.start_time,
    },
    target: {
      waveIndex: targetWave.wave_index,
      startTime: targetWave.start_time,
      capacity: targetWave.capacity,
      assignedCount: targetWave.assigned_count,
      remainingCapacity,
      isClosed: targetWave.is_closed,
    },
    impacts: {
      departure: sameWave ? 'unchanged' : 'changed',
      group: anchorApplies ? (anchorWaveIndex === targetWave.wave_index ? 'anchor_applies' : 'blocked_by_anchor') : 'none',
      waveCounters: 'would_refresh',
    },
    warnings,
    blockers,
  }

  return NextResponse.json({ preview })
}
