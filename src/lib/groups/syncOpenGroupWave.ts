import { OPEN_SAS_CONFIG, isOpenFormatTicket } from '@/lib/openSas'

type AdminClient = any

type SyncInput = {
  admin: AdminClient
  eventId: string
  waveIndex: number
  startTime: string
  profileIds: string[]
}

const firstRelation = <T,>(value: T | T[] | null | undefined): T | null => {
  if (!value) return null
  return Array.isArray(value) ? value[0] ?? null : value
}

export async function syncOpenRegistrationsToWave({
  admin,
  eventId,
  waveIndex,
  startTime,
  profileIds,
}: SyncInput): Promise<{ moved: number; openRegistrations: number }> {
  if (!profileIds.length) return { moved: 0, openRegistrations: 0 }

  const { data: rows, error } = await admin
    .from('registrations')
    .select('id, user_id, wave_index, ticket:tickets(name, race:races(name))')
    .eq('event_id', eventId)
    .in('user_id', profileIds)

  if (error) throw error

  const openRows = (rows ?? []).filter((row: any) => {
    const ticket = firstRelation(row.ticket) as any
    const race = firstRelation(ticket?.race) as any
    return isOpenFormatTicket(ticket?.name ?? null, race?.name ?? null)
  }) as Array<{ id: string; wave_index: number | null }>

  const toMove = openRows.filter((row) => row.wave_index !== waveIndex)
  if (!toMove.length) return { moved: 0, openRegistrations: openRows.length }

  const oldWaves = new Set<number>()
  for (const row of toMove) {
    if (typeof row.wave_index === 'number') oldWaves.add(row.wave_index)
  }

  const { count: existingInTarget } = await admin
    .from('registrations')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .eq('wave_index', waveIndex)

  for (let i = 0; i < toMove.length; i += 1) {
    const row = toMove[i]
    await admin
      .from('registrations')
      .update({
        wave_index: waveIndex,
        start_time: startTime,
        wave_capacity: OPEN_SAS_CONFIG.waveCapacity,
        wave_position: (existingInTarget ?? 0) + i + 1,
        auto_assigned: true,
        preferred_window_start: startTime,
        preferred_window_end: startTime,
        latest_allowed_time: startTime,
        assignment_constraint_breached: false,
      })
      .eq('id', row.id)
  }

  const affectedWaves = new Set<number>([waveIndex, ...oldWaves])
  for (const affectedWaveIndex of affectedWaves) {
    const { count } = await admin
      .from('registrations')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .eq('wave_index', affectedWaveIndex)

    await admin
      .from('event_waves')
      .update({
        assigned_count: count ?? 0,
        updated_at: new Date().toISOString(),
      })
      .eq('event_id', eventId)
      .eq('wave_index', affectedWaveIndex)
  }

  return { moved: toMove.length, openRegistrations: openRows.length }
}
