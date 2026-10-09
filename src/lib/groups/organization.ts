import type { SupabaseClient } from '@supabase/supabase-js'

type Admin = Pick<SupabaseClient, 'from'>

const firstRelation = <T,>(value: T | T[] | null | undefined): T | null =>
  Array.isArray(value) ? (value[0] ?? null) : (value ?? null)

/**
 * Organization a user-created group belongs to. Admin screens only list groups of
 * their own organization, so a group without one would be invisible to them.
 *
 * Resolution order: the organization of the user's latest registration, then of the
 * next upcoming event, then the only organization when the platform has just one.
 */
export async function resolveGroupOrganizationId(admin: Admin, userId: string, now: Date = new Date()): Promise<string | null> {
  const { data: registrations, error: registrationsError } = await admin
    .from('registrations')
    .select('event:events(organization_id)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(5)
  if (registrationsError) throw registrationsError

  for (const row of (registrations ?? []) as Array<{ event: { organization_id: string | null } | Array<{ organization_id: string | null }> | null }>) {
    const organizationId = firstRelation(row.event)?.organization_id
    if (organizationId) return organizationId
  }

  const { data: events, error: eventsError } = await admin
    .from('events')
    .select('organization_id')
    .not('organization_id', 'is', null)
    .gte('date', now.toISOString())
    .order('date', { ascending: true })
    .limit(1)
  if (eventsError) throw eventsError
  const upcoming = (events ?? [])[0]?.organization_id as string | undefined
  if (upcoming) return upcoming

  const { data: organizations, error: organizationsError } = await admin.from('organizations').select('id').limit(2)
  if (organizationsError) throw organizationsError
  return organizations?.length === 1 ? (organizations[0]?.id as string) : null
}
