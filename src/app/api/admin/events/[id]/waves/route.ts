import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { withRequestLogging } from '@/lib/logging/adminRequestLogger'
import {
  buildOpenWaveRows,
  getOpenWaveProvisioningState,
} from '@/lib/openSas'
import { requireAdmin } from '@/lib/auth/requireAdmin'

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
  const auth = await requireAdmin(request)
  if (!auth.ok) {
    return auth.response
  }

  const { id } = await params
  const admin = supabaseAdmin()

  const { data: event, error: eventError } = await admin
    .from('events')
    .select('id')
    .eq('id', id)
    .single()

  if (eventError || !event) {
    return NextResponse.json({ error: 'Événement introuvable' }, { status: 404 })
  }

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

async function handleProvision(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin(request)
  if (!auth.ok) {
    return auth.response
  }

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

  const { data: existingWaves, error: existingWavesError } = await admin
    .from('event_waves')
    .select('wave_index')
    .eq('event_id', event.id)

  if (existingWavesError) {
    console.error('[admin waves] provisioning state fetch error', existingWavesError)
    return NextResponse.json({ error: 'Impossible de vérifier la configuration des SAS' }, { status: 500 })
  }

  const state = getOpenWaveProvisioningState(
    (existingWaves ?? []).map((wave) => wave.wave_index),
  )

  if (state === 'provisioned') {
    return NextResponse.json({ state, created: false })
  }

  if (state === 'inconsistent') {
    return NextResponse.json(
      { error: 'Configuration SAS incomplète : aucune correction automatique n’a été appliquée.' },
      { status: 409 },
    )
  }

  const { rows } = buildOpenWaveRows(event.id, event.date)
  const { error: provisionError } = await admin
    .from('event_waves')
    .upsert(rows, { onConflict: 'event_id,wave_index', ignoreDuplicates: true })

  if (provisionError) {
    console.error('[admin waves] provision error', provisionError)
    return NextResponse.json({ error: 'Impossible d’initialiser les SAS' }, { status: 500 })
  }

  const { data: provisionedWaves, error: verificationError } = await admin
    .from('event_waves')
    .select('wave_index')
    .eq('event_id', event.id)

  if (verificationError) {
    console.error('[admin waves] provision verification error', verificationError)
    return NextResponse.json({ error: 'Impossible de vérifier les SAS initialisés' }, { status: 500 })
  }

  const provisionedState = getOpenWaveProvisioningState(
    (provisionedWaves ?? []).map((wave) => wave.wave_index),
  )

  if (provisionedState !== 'provisioned') {
    return NextResponse.json(
      { error: 'Initialisation SAS incomplète : vérification manuelle requise.' },
      { status: 409 },
    )
  }

  return NextResponse.json({ state: provisionedState, created: true, wave_count: rows.length })
}

export const POST = withRequestLogging(handleProvision, {
  actionType: 'Initialisation SAS OPEN événement admin',
})

async function handlePatch(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin(request)
  if (!auth.ok) {
    return auth.response
  }

  const { id } = await params
  const admin = supabaseAdmin()

  const { data: event, error: eventError } = await admin
    .from('events')
    .select('id')
    .eq('id', id)
    .single()

  if (eventError || !event) {
    return NextResponse.json({ error: 'Événement introuvable' }, { status: 404 })
  }

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

export const PATCH = withRequestLogging(handlePatch, {
  actionType: 'Mise à jour vagues événement admin',
})
