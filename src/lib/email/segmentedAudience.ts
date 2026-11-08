import { resolveAudience, type AudienceSelector } from '@/lib/email/audience'
import type { MarketingRecipient } from '@/lib/email/marketing'
import { loadSegmentIdentity } from '@/lib/email/segmentStore'
import { applySegment, type AudienceSegment } from '@/lib/email/segments'

export interface SegmentedAudienceSelector extends AudienceSelector {
  segment?: AudienceSegment
  /** Narrows registered, not_registered and volunteers to one event. */
  eventId?: string
}

/** People who consented to the selected lists, narrowed to a segment. */
export async function resolveSegmentedAudience(
  selector: SegmentedAudienceSelector = {},
): Promise<MarketingRecipient[]> {
  const { segment = 'all', eventId, ...listSelector } = selector
  const audience = await resolveAudience(listSelector)
  if (segment === 'all') return audience

  const identity = await loadSegmentIdentity(segment, eventId)
  return applySegment(audience, segment, identity)
}
