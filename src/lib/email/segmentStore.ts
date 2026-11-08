import { supabaseAdmin } from '@/lib/supabase/server'
import type { AudienceSegment, SegmentIdentity } from '@/lib/email/segments'

const PAGE_SIZE = 1000

interface IdentityRow {
  user_id?: string | null
  email?: string | null
}

/** Every page of a filtered query; a segment must never be cut short silently. */
async function readAll(
  build: (from: number, to: number) => PromiseLike<{ data: IdentityRow[] | null; error: { message: string } | null }>,
): Promise<IdentityRow[]> {
  const rows: IdentityRow[] = []
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await build(from, from + PAGE_SIZE - 1)
    if (error) throw new Error(`[segments] read failed: ${error.message}`)
    const page = data ?? []
    rows.push(...page)
    if (page.length < PAGE_SIZE) return rows
  }
}

function toIdentity(rows: IdentityRow[]): SegmentIdentity {
  const userIds = new Set<string>()
  const emails = new Set<string>()
  for (const row of rows) {
    if (row.user_id) userIds.add(row.user_id)
    const email = row.email?.trim().toLowerCase()
    if (email) emails.add(email)
  }
  return { userIds, emails }
}

/**
 * The people behind a segment. `registered` and `not_registered` both read the participants of
 * non-cancelled registrations; `volunteers` reads volunteer applications. `all` needs nothing.
 */
export async function loadSegmentIdentity(segment: AudienceSegment, eventId?: string): Promise<SegmentIdentity> {
  if (segment === 'all') return { userIds: new Set(), emails: new Set() }

  const admin = supabaseAdmin()

  if (segment === 'volunteers') {
    const rows = await readAll((from, to) => {
      let query = admin.from('volunteer_applications').select('email')
      if (eventId) query = query.eq('event_id', eventId)
      return query.order('id').range(from, to)
    })
    return toIdentity(rows)
  }

  const rows = await readAll((from, to) => {
    let query = admin.from('registrations').select('user_id, email').is('cancelled_at', null)
    if (eventId) query = query.eq('event_id', eventId)
    return query.order('id').range(from, to)
  })
  return toIdentity(rows)
}
