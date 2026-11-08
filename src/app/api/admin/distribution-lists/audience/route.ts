import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { resolveSegmentedAudience } from '@/lib/email/segmentedAudience'
import { AUDIENCE_SEGMENTS } from '@/lib/email/segments'

const previewSchema = z.object({
  listIds: z.array(z.string()).min(1),
  segment: z.enum(AUDIENCE_SEGMENTS).default('all'),
  eventId: z.string().uuid().optional(),
})

/**
 * POST /api/admin/distribution-lists/audience
 * How many distinct addresses a send would reach, with the same rules as the send itself:
 * traced consent, segment, digest preference, no suppressed address. Sends nothing.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.ok) return auth.response

  const parsed = previewSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request data' }, { status: 400 })
  }

  try {
    const audience = await resolveSegmentedAudience(parsed.data)
    return NextResponse.json({ count: audience.length })
  } catch (error) {
    console.error('[admin audience preview] error', error)
    return NextResponse.json({ error: 'Failed to resolve audience' }, { status: 500 })
  }
}
