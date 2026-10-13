import { supabaseAdmin } from '@/lib/supabase/server'
import type { Bootcamp } from '@/types/Bootcamp'

/**
 * Server-side read of every bootcamp with its registration count, without
 * anything about the visitor (`is_registered` is false). Shared by
 * `/api/bootcamps`, which adds the visitor's registrations, and the
 * `/bootcamps` page, which renders the list into the HTML.
 * Uses the admin client so counts are not hidden by RLS. Throws on a
 * database error.
 */
export async function loadPublicBootcamps(): Promise<Bootcamp[]> {
  const { data, error } = await supabaseAdmin()
    .from('bootcamps')
    .select(`
      *,
      bootcamp_registrations(count)
    `)
    .order('starts_at', { ascending: true })

  if (error) throw error

  return (data ?? []).map(({ bootcamp_registrations, ...bootcamp }) => ({
    ...bootcamp,
    registration_count: Number(
      (bootcamp_registrations as Array<{ count: number | string }> | null)?.[0]?.count ?? 0,
    ),
    is_registered: false,
  })) as Bootcamp[]
}
