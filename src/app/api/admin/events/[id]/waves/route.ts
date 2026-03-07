import { NextResponse } from 'next/server'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase/server'
import { buildOpenWaveRows } from '@/lib/openSas'

const ensureAdmin = async () => {
  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: NextResponse.json({ error: 'Non authentifié' }, { status: 401 }) }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return { error: NextResponse.json({ error: 'Accès refusé' }, { status: 403 }) }
  }

  return { supabase, user }
}

const ensureWaves = async (admin: ReturnType<typeof supabaseAdmin>, eventId: string, eventDateIso: string) => {
  const { rows } = buildOpenWaveRows(eventId, eventDateIso)
  await admin
    .from('event_waves')
    .upsert(rows, { onConflict: 'event_id,wave_index', ignoreDuplicates: true })
}

const toCsv = (waves: any[]) => {
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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await ensureAdmin()
  if (auth.error) return auth.error

  const { id } = await params
  const admin = supabaseAdmin()

  const { data: event, error: eventError } = await admin
    .from('events')
    .select('id, date')
    .eq('id', id)
    .single()

  if (eventError || !event) {
    return NextResponse.json({ error: 'Événement introuvable' }, { status: 404 })
  }

  await ensureWaves(admin, event.id, event.date)
  const url = new URL(request.url)
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
      .eq('wave_index', waveIndexParam)
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
          .select('id, full_name')
          .in('id', profileIds)
      : { data: [], error: null }

    if (profilesError) {
      console.error('[admin waves] profiles fetch error', profilesError)
    }

    const profileMap = new Map((profiles ?? []).map((profile: any) => [profile.id, profile.full_name ?? null]))
    const participants = (rows ?? []).map((row) => {
      const profileName = row.user_id ? profileMap.get(row.user_id) ?? null : null
      const fallbackName = row.email.split('@')[0] || 'Nom non renseigné'

      return {
        id: row.id,
        email: row.email,
        full_name: profileName || fallbackName,
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
        'Content-Disposition': `attachment; filename="event-${event.id}-sas-open.csv"`,
      },
    })
  }

  return NextResponse.json({ waves: waves ?? [] })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await ensureAdmin()
  if (auth.error) return auth.error

  const { id } = await params
  const admin = supabaseAdmin()

  const { data: event, error: eventError } = await admin
    .from('events')
    .select('id, date')
    .eq('id', id)
    .single()

  if (eventError || !event) {
    return NextResponse.json({ error: 'Événement introuvable' }, { status: 404 })
  }

  await ensureWaves(admin, event.id, event.date)

  const payload = await request.json().catch(() => ({}))
  const capacityAll = Number.isFinite(Number(payload.capacity_all)) ? Number(payload.capacity_all) : null
  const waveIndex = Number.isFinite(Number(payload.wave_index)) ? Number(payload.wave_index) : null
  const capacity = Number.isFinite(Number(payload.capacity)) ? Number(payload.capacity) : null
  const isClosed = typeof payload.is_closed === 'boolean' ? payload.is_closed : null

  if (capacityAll !== null) {
    if (capacityAll < 0) {
      return NextResponse.json({ error: 'Capacité invalide' }, { status: 400 })
    }
    const { error } = await admin
      .from('event_waves')
      .update({ capacity: capacityAll, updated_at: new Date().toISOString() })
      .eq('event_id', event.id)

    if (error) {
      console.error('[admin waves] update all error', error)
      return NextResponse.json({ error: 'Impossible de mettre à jour les SAS' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  }

  if (!waveIndex) {
    return NextResponse.json({ error: 'wave_index manquant' }, { status: 400 })
  }

  const updates: Record<string, any> = { updated_at: new Date().toISOString() }
  if (capacity !== null) {
    if (capacity < 0) {
      return NextResponse.json({ error: 'Capacité invalide' }, { status: 400 })
    }
    updates.capacity = capacity
  }
  if (isClosed !== null) updates.is_closed = isClosed

  const { error } = await admin
    .from('event_waves')
    .update(updates)
    .eq('event_id', event.id)
    .eq('wave_index', waveIndex)

  if (error) {
    console.error('[admin waves] update error', error)
    return NextResponse.json({ error: 'Impossible de mettre à jour la vague' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
