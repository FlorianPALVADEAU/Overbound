type AdminClient = any

type SyncInput = {
  admin: AdminClient
  eventId: string
  waveIndex: number
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
  profileIds,
}: SyncInput): Promise<{ moved: number; waveRegistrations: number }> {
  if (!profileIds.length) return { moved: 0, waveRegistrations: 0 }

  const { data: rows, error } = await admin
    .from('registrations')
    .select('id, user_id, wave_index, ticket:tickets(operations_config)')
    .eq('event_id', eventId)
    .in('user_id', profileIds)

  if (error) throw error

  const waveRows = (rows ?? []).filter((row: any) => {
    const ticket = firstRelation(row.ticket) as any
    return ticket?.operations_config?.departure_mode === 'wave'
  }) as Array<{ id: string; wave_index: number | null }>

  const toMove = waveRows.filter((row) => row.wave_index !== waveIndex)
  for (const row of toMove) {
    const { error: syncError } = await admin.rpc('sync_registration_to_group_anchor', {
      p_event_id: eventId,
      p_registration_id: row.id,
      p_wave_index: waveIndex,
    })
    if (syncError) throw syncError
  }

  return { moved: toMove.length, waveRegistrations: waveRows.length }
}
