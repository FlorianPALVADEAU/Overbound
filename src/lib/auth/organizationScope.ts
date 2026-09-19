import type { SupabaseClient } from '@supabase/supabase-js'

type AdminDatabaseClient = SupabaseClient

/** Returns whether a profile has any data or membership in an organization. */
export const profileBelongsToOrganization = async (
  admin: AdminDatabaseClient,
  organizationId: string,
  profileId: string,
): Promise<boolean> => {
  const [{ data: membership }, { data: registration }, { data: groupMember }] = await Promise.all([
    admin
      .from('organization_memberships')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('profile_id', profileId)
      .eq('status', 'active')
      .maybeSingle(),
    admin
      .from('registrations')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('user_id', profileId)
      .limit(1)
      .maybeSingle(),
    admin
      .from('group_members')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('profile_id', profileId)
      .limit(1)
      .maybeSingle(),
  ])

  return Boolean(membership || registration || groupMember)
}

export const registrationBelongsToOrganization = async (
  admin: AdminDatabaseClient,
  organizationId: string,
  registrationId: string,
  eventId?: string,
): Promise<boolean> => {
  let query = admin
    .from('registrations')
    .select('id')
    .eq('id', registrationId)
    .eq('organization_id', organizationId)

  if (eventId) query = query.eq('event_id', eventId)
  const { data, error } = await query.maybeSingle()
  if (error) throw error
  return Boolean(data)
}
