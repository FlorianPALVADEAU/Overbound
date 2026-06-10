import { isOpenFormatTicket } from '@/lib/openSas'

type AdminClient = any

const firstRelation = <T,>(value: T | T[] | null | undefined): T | null => {
  if (!value) return null
  return Array.isArray(value) ? value[0] ?? null : value
}

export async function resolveGroupAnchorFromProfile(
  admin: AdminClient,
  profileId: string,
): Promise<{ eventId: string; waveIndex: number; startTime: string } | null> {
  const { data: rows, error } = await admin
    .from('registrations')
    .select('event_id, wave_index, start_time, created_at, ticket:tickets(name, race:races(name))')
    .eq('user_id', profileId)
    .not('event_id', 'is', null)
    .not('wave_index', 'is', null)
    .not('start_time', 'is', null)
    .order('created_at', { ascending: false })

  if (error) throw error

  for (const row of rows ?? []) {
    const ticket = firstRelation((row as any).ticket) as any
    const race = firstRelation(ticket?.race) as any
    if (!isOpenFormatTicket(ticket?.name ?? null, race?.name ?? null)) {
      continue
    }

    return {
      eventId: (row as any).event_id,
      waveIndex: (row as any).wave_index,
      startTime: (row as any).start_time,
    }
  }

  return null
}
