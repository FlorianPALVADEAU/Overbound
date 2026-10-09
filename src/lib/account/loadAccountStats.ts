import type { SupabaseClient } from '@supabase/supabase-js'
import { isOpenFormatTicket, isRankedFormatTicket } from '@/lib/openSas'
import {
  buildGroupStats,
  buildRunnerStats,
  type AccountStats,
  type StatsFormat,
  type StatsRegistration,
} from './stats'

const firstRelation = <T,>(value: T | T[] | null | undefined): T | null =>
  Array.isArray(value) ? (value[0] ?? null) : (value ?? null)

const REGISTRATION_SELECT = `
  user_id, email, event_id, race_format, start_time, checked_in,
  ticket:tickets(name, race:races!tickets_race_id_fkey(name)),
  event:events(title, date)
`

interface RegistrationRow {
  user_id: string | null
  email: string | null
  event_id: string | null
  race_format: string | null
  start_time: string | null
  checked_in: boolean | null
  ticket: { name: string | null; race: { name: string | null } | Array<{ name: string | null }> | null } | Array<unknown> | null
  event: { title: string | null; date: string | null } | Array<{ title: string | null; date: string | null }> | null
}

/** Stored `race_format` wins; ticket/race naming is only the fallback (see CLAUDE.md, format detection). */
const resolveFormat = (row: RegistrationRow): StatsFormat | null => {
  if (row.race_format === 'open' || row.race_format === 'ranked') return row.race_format
  const ticket = firstRelation(row.ticket) as { name: string | null; race: { name: string | null } | Array<{ name: string | null }> | null } | null
  const raceName = firstRelation(ticket?.race)?.name ?? null
  if (isOpenFormatTicket(ticket?.name, raceName)) return 'open'
  if (isRankedFormatTicket(ticket?.name, raceName)) return 'ranked'
  return null
}

const toStatsRegistration = (row: RegistrationRow): StatsRegistration => {
  const event = firstRelation(row.event)
  return {
    userId: row.user_id,
    email: row.email,
    eventId: row.event_id,
    eventTitle: event?.title ?? null,
    eventDate: event?.date ?? null,
    format: resolveFormat(row),
    startTime: row.start_time,
    checkedIn: Boolean(row.checked_in),
  }
}

/** Runner figures plus, when the user belongs to a group, that group's figures. */
export async function loadAccountStats(
  admin: SupabaseClient,
  user: { id: string; email?: string | null },
): Promise<AccountStats> {
  const { data: ownRows, error: ownError } = await admin
    .from('registrations')
    .select(REGISTRATION_SELECT)
    .eq('user_id', user.id)
  if (ownError) throw ownError

  const runner = buildRunnerStats(((ownRows ?? []) as unknown as RegistrationRow[]).map(toStatsRegistration), user.email)

  const { data: membership, error: membershipError } = await admin
    .from('group_members')
    .select('group_id')
    .eq('profile_id', user.id)
    .maybeSingle()
  if (membershipError) throw membershipError
  if (!membership) return { runner, group: null }

  const [{ data: group, error: groupError }, { data: members, error: membersError }] = await Promise.all([
    admin.from('groups').select('name, anchor_event_id').eq('id', membership.group_id).maybeSingle(),
    admin.from('group_members').select('profile_id').eq('group_id', membership.group_id),
  ])
  if (groupError) throw groupError
  if (membersError) throw membersError
  if (!group) return { runner, group: null }

  const memberIds = (members ?? []).map((member) => member.profile_id as string)
  const { data: memberRows, error: memberRowsError } = await admin
    .from('registrations')
    .select(REGISTRATION_SELECT)
    .in('user_id', memberIds)
  if (memberRowsError) throw memberRowsError

  const groupStats = buildGroupStats(
    ((memberRows ?? []) as unknown as RegistrationRow[]).map(toStatsRegistration),
    memberIds,
    (group.anchor_event_id as string | null) ?? null,
  )

  return { runner, group: { name: group.name as string, ...groupStats } }
}
