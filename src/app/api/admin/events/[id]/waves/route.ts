import { NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase/server'
import { withRequestLogging } from '@/lib/logging/adminRequestLogger'
import { requireAdminOrganization } from '@/lib/auth/requireAdminOrganization'
import { formatProfileName } from '@/lib/account/profile'

interface WaveCsvRow {
  wave_index: number
  start_time: string
  capacity: number | null
  assigned_count: number | null
  is_closed: boolean | null
}

const toCsv = (waves: WaveCsvRow[]) => {
  const header = ['wave_index', 'start_time', 'capacity', 'assigned_count', 'is_closed']
  const lines = [header.join(',')]

  for (const wave of waves) {
    const row = [
      wave.wave_index,
      wave.start_time,
      wave.capacity,
      wave.assigned_count,
      wave.is_closed,
    ]
    lines.push(row.map((value) => JSON.stringify(value ?? '')).join(','))
  }

  return lines.join('\n')
}

const ticketIdSchema = z.string().uuid()

const patchWavesSchema = z.object({
  capacity_all: z.number().int().min(0).optional(),
  wave_index: z.number().int().positive().optional(),
  capacity: z.number().int().min(0).optional(),
  is_closed: z.boolean().optional(),
  start_time: z.string().datetime({ offset: true }).optional(),
})

interface EventWaveUpdate {
  updated_at: string
  capacity?: number
  is_closed?: boolean
  start_time?: string
}
const createWavesSchema = z.discriminatedUnion('mode', [
  z.object({
    mode: z.literal('single'),
    start_time: z.string().datetime({ offset: true }),
    capacity: z.number().int().min(0),
  }),
  z.object({
    mode: z.literal('series'),
    start_time: z.string().datetime({ offset: true }),
    capacity: z.number().int().min(0),
    count: z.number().int().min(1).max(200),
    interval_minutes: z.number().int().min(1).max(1440),
  }),
])

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminOrganization(request)
  if (!auth.ok) {
    return auth.response
  }

  const { id } = await params
  const admin = supabaseAdmin()

  const { data: event, error: eventError } = await admin
    .from('events')
    .select('id')
    .eq('id', id)
    .eq('organization_id', auth.organizationId)
    .single()

  if (eventError || !event) {
    return NextResponse.json({ error: 'Événement introuvable' }, { status: 404 })
  }

  const url = new URL(request.url)
  const parsedTicketId = ticketIdSchema.safeParse(url.searchParams.get('ticket_id'))
  if (!parsedTicketId.success) {
    return NextResponse.json({ error: 'ticket_id invalide ou manquant' }, { status: 400 })
  }
  const ticketId = parsedTicketId.data
  const { data: ticket, error: ticketError } = await admin
    .from('tickets')
    .select('id, name, operations_config')
    .eq('id', ticketId)
    .eq('event_id', event.id)
    .eq('organization_id', auth.organizationId)
    .maybeSingle()

  if (ticketError || !ticket) {
    return NextResponse.json({ error: 'Billet introuvable pour cet événement' }, { status: 404 })
  }
  if (ticket.operations_config?.departure_mode !== 'wave') {
    return NextResponse.json({ error: 'Ce billet n’est pas configuré pour un départ par SAS' }, { status: 422 })
  }
  const includeRegistrations = url.searchParams.get('include_registrations') === 'true'
  const waveIndexParam = Number.parseInt(url.searchParams.get('wave_index') ?? '', 10)

  if (includeRegistrations) {
    if (!Number.isFinite(waveIndexParam) || waveIndexParam <= 0) {
      return NextResponse.json({ error: 'wave_index invalide' }, { status: 400 })
    }

    const { data: rows, error: registrationsError } = await admin
      .from('registrations')
      .select('id, email, start_time, wave_position, user_id, created_at')
      .eq('event_id', event.id)
      .eq('organization_id', auth.organizationId)
      .eq('wave_index', waveIndexParam)
      .eq('ticket_id', ticketId)
      .order('wave_position', { ascending: true })
      .order('created_at', { ascending: true })

    if (registrationsError) {
      console.error('[admin waves] registrations fetch error', registrationsError)
      return NextResponse.json({ error: 'Impossible de récupérer les inscrits du SAS' }, { status: 500 })
    }

    const profileIds = Array.from(
      new Set((rows ?? []).map((row) => row.user_id).filter(Boolean)),
    ) as string[]

    const { data: profiles, error: profilesError } = profileIds.length
      ? await admin
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', profileIds)
      : { data: [], error: null }

    if (profilesError) {
      console.error('[admin waves] profiles fetch error', profilesError)
    }

    const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, formatProfileName(profile)]))
    const participants = (rows ?? []).map((row) => {
      const profileName = row.user_id ? profileMap.get(row.user_id) ?? null : null
      const fallbackName = row.email.split('@')[0] || 'Nom non renseigné'

      return {
        id: row.id,
        email: row.email,
        display_name: profileName || fallbackName,
        start_time: row.start_time,
        wave_position: row.wave_position,
      }
    })

    return NextResponse.json({
      wave_index: waveIndexParam,
      participants,
    })
  }

  const { data: waves, error } = await admin
    .from('event_waves')
    .select('wave_index, start_time, capacity, assigned_count, is_closed')
    .eq('event_id', event.id)
    .eq('ticket_id', ticketId)
    .order('wave_index', { ascending: true })

  if (error) {
    console.error('[admin waves] fetch error', error)
    return NextResponse.json({ error: 'Impossible de récupérer les SAS' }, { status: 500 })
  }

  if (url.searchParams.get('format') === 'csv') {
    const csv = toCsv(waves ?? [])
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="ticket-${ticketId}-sas.csv"`,
      },
    })
  }

  return NextResponse.json({ waves: waves ?? [] })
}

async function handleProvision(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminOrganization(request)
  if (!auth.ok) {
    return auth.response
  }

  const { id } = await params
  const url = new URL(request.url)
  const parsedTicketId = ticketIdSchema.safeParse(url.searchParams.get('ticket_id'))
  if (!parsedTicketId.success) {
    return NextResponse.json({ error: 'ticket_id invalide ou manquant' }, { status: 400 })
  }
  const ticketId = parsedTicketId.data
  const admin = supabaseAdmin()

  const { data: event, error: eventError } = await admin
    .from('events')
    .select('id, date')
    .eq('id', id)
    .eq('organization_id', auth.organizationId)
    .single()

  if (eventError || !event) {
    return NextResponse.json({ error: 'Événement introuvable' }, { status: 404 })
  }

  const { data: ticket } = await admin
    .from('tickets')
    .select('id, operations_config')
    .eq('id', ticketId)
    .eq('event_id', event.id)
    .eq('organization_id', auth.organizationId)
    .maybeSingle()
  if (!ticket) return NextResponse.json({ error: 'Billet introuvable pour cet événement' }, { status: 404 })
  if (ticket.operations_config?.departure_mode !== 'wave') {
    return NextResponse.json({ error: 'Ce billet n’est pas configuré pour un départ par SAS' }, { status: 422 })
  }

  const { data: existingWaves, error: existingWavesError } = await admin
    .from('event_waves')
    .select('wave_index')
    .eq('event_id', event.id)
    .eq('ticket_id', ticketId)

  if (existingWavesError) {
    console.error('[admin waves] provisioning state fetch error', existingWavesError)
    return NextResponse.json({ error: 'Impossible de vérifier la configuration des SAS' }, { status: 500 })
  }

  const parsedBody = createWavesSchema.safeParse(await request.json().catch(() => null))
  if (!parsedBody.success) {
    return NextResponse.json({ error: 'Configuration des SAS invalide' }, { status: 400 })
  }

  const firstWaveIndex = Math.max(0, ...(existingWaves ?? []).map((wave) => wave.wave_index)) + 1
  const waveCount = parsedBody.data.mode === 'series' ? parsedBody.data.count : 1
  const intervalMinutes = parsedBody.data.mode === 'series' ? parsedBody.data.interval_minutes : 0
  const firstStartTime = new Date(parsedBody.data.start_time)
  const rows = Array.from({ length: waveCount }, (_, offset) => ({
    event_id: event.id,
    ticket_id: ticketId,
    organization_id: auth.organizationId,
    wave_index: firstWaveIndex + offset,
    start_time: new Date(firstStartTime.getTime() + offset * intervalMinutes * 60_000).toISOString(),
    capacity: parsedBody.data.capacity,
    assigned_count: 0,
    is_closed: false,
  }))
  const { error: provisionError } = await admin
    .from('event_waves')
    .insert(rows)

  if (provisionError) {
    // Contrainte event_waves_ticket_wave_unique : deux initialisations concurrentes calculent le même wave_index.
    if (provisionError.code === '23505') {
      return NextResponse.json({ error: 'Les SAS viennent d’être initialisés, recharger la page' }, { status: 409 })
    }
    console.error('[admin waves] provision error', provisionError)
    return NextResponse.json({ error: 'Impossible d’initialiser les SAS' }, { status: 500 })
  }

  return NextResponse.json({ created: true, wave_count: rows.length }, { status: 201 })
}

export const POST = withRequestLogging(handleProvision, {
  actionType: 'Initialisation SAS événement admin',
})

async function handlePatch(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminOrganization(request)
  if (!auth.ok) {
    return auth.response
  }

  const { id } = await params
  const url = new URL(request.url)
  const parsedTicketId = ticketIdSchema.safeParse(url.searchParams.get('ticket_id'))
  if (!parsedTicketId.success) {
    return NextResponse.json({ error: 'ticket_id invalide ou manquant' }, { status: 400 })
  }
  const ticketId = parsedTicketId.data
  const admin = supabaseAdmin()

  const { data: event, error: eventError } = await admin
    .from('events')
    .select('id')
    .eq('id', id)
    .eq('organization_id', auth.organizationId)
    .single()

  if (eventError || !event) {
    return NextResponse.json({ error: 'Événement introuvable' }, { status: 404 })
  }

  const { data: ticket } = await admin
    .from('tickets')
    .select('id, operations_config')
    .eq('id', ticketId)
    .eq('event_id', event.id)
    .eq('organization_id', auth.organizationId)
    .maybeSingle()
  if (!ticket) return NextResponse.json({ error: 'Billet introuvable pour cet événement' }, { status: 404 })
  if (ticket.operations_config?.departure_mode !== 'wave') {
    return NextResponse.json({ error: 'Ce billet n’est pas configuré pour un départ par SAS' }, { status: 422 })
  }

  const parsedPayload = patchWavesSchema.safeParse(await request.json().catch(() => null))
  if (!parsedPayload.success) {
    return NextResponse.json({ error: 'Requête invalide' }, { status: 400 })
  }
  const payload = parsedPayload.data
  const capacityAll = payload.capacity_all ?? null
  const waveIndex = payload.wave_index ?? null
  const capacity = payload.capacity ?? null
  const isClosed = payload.is_closed ?? null
  const startTime = payload.start_time ?? null

  if (capacityAll !== null) {
    const { error } = await admin
      .from('event_waves')
      .update({ capacity: capacityAll, updated_at: new Date().toISOString() })
      .eq('event_id', event.id)
      .eq('ticket_id', ticketId)

    if (error) {
      console.error('[admin waves] update all error', error)
      return NextResponse.json({ error: 'Impossible de mettre à jour les SAS' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  }

  if (!waveIndex) {
    return NextResponse.json({ error: 'wave_index manquant' }, { status: 400 })
  }

  const updates: EventWaveUpdate = { updated_at: new Date().toISOString() }
  if (capacity !== null) updates.capacity = capacity
  if (isClosed !== null) updates.is_closed = isClosed
  if (startTime !== null) updates.start_time = startTime

  const { error } = await admin
    .from('event_waves')
    .update(updates)
    .eq('event_id', event.id)
    .eq('ticket_id', ticketId)
    .eq('wave_index', waveIndex)

  if (error) {
    console.error('[admin waves] update error', error)
    return NextResponse.json({ error: 'Impossible de mettre à jour la vague' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export const PATCH = withRequestLogging(handlePatch, {
  actionType: 'Mise à jour vagues événement admin',
})

async function handleDelete(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminOrganization(request)
  if (!auth.ok) return auth.response

  const { id } = await params
  const url = new URL(request.url)
  const parsedTicketId = ticketIdSchema.safeParse(url.searchParams.get('ticket_id'))
  const waveIndex = Number(url.searchParams.get('wave_index'))
  const deleteEmpty = url.searchParams.get('empty') === 'true'
  if (!parsedTicketId.success || (!deleteEmpty && (!Number.isInteger(waveIndex) || waveIndex <= 0))) {
    return NextResponse.json({ error: 'Billet ou SAS invalide' }, { status: 400 })
  }

  const admin = supabaseAdmin()
  const { data: ticket } = await admin
    .from('tickets')
    .select('id')
    .eq('id', parsedTicketId.data)
    .eq('event_id', id)
    .eq('organization_id', auth.organizationId)
    .maybeSingle()
  if (!ticket) return NextResponse.json({ error: 'Billet introuvable pour cet événement' }, { status: 404 })

  if (deleteEmpty) {
    const { error } = await admin
      .from('event_waves')
      .delete()
      .eq('event_id', id)
      .eq('ticket_id', parsedTicketId.data)
      .eq('assigned_count', 0)
    if (error) return NextResponse.json({ error: 'Impossible de supprimer les SAS vides' }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  const { data: wave } = await admin
    .from('event_waves')
    .select('id, assigned_count')
    .eq('event_id', id)
    .eq('ticket_id', parsedTicketId.data)
    .eq('wave_index', waveIndex)
    .maybeSingle()
  if (!wave) return NextResponse.json({ error: 'SAS introuvable' }, { status: 404 })
  if ((wave.assigned_count ?? 0) > 0) {
    return NextResponse.json({ error: 'Impossible de supprimer un SAS avec des inscrits' }, { status: 409 })
  }

  const { error } = await admin.from('event_waves').delete().eq('id', wave.id)
  if (error) return NextResponse.json({ error: 'Impossible de supprimer le SAS' }, { status: 500 })
  return NextResponse.json({ success: true })
}

export const DELETE = withRequestLogging(handleDelete, {
  actionType: 'Suppression SAS billet admin',
})
