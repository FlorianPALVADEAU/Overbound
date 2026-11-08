/**
 * Audience segments: who, among the people who consented to a list, an admin wants to reach.
 * A segment narrows the audience, it never creates a right to write: the lists still decide
 * who consented (see consent.ts).
 */

export const AUDIENCE_SEGMENTS = ['all', 'registered', 'not_registered', 'volunteers'] as const
export type AudienceSegment = (typeof AUDIENCE_SEGMENTS)[number]

export const SEGMENT_LABELS: Record<AudienceSegment, string> = {
  all: 'Tout le monde',
  registered: 'Inscrits à une course',
  not_registered: 'Pas encore inscrits',
  volunteers: 'Bénévoles (candidatures)',
}

/** Segments that can be narrowed to one event. */
export const EVENT_SCOPED_SEGMENTS: readonly AudienceSegment[] = ['registered', 'not_registered', 'volunteers']

/** The people a segment is made of, known by account id and/or by address (lowercase). */
export interface SegmentIdentity {
  userIds: ReadonlySet<string>
  emails: ReadonlySet<string>
}

export interface SegmentRecipient {
  email: string
  userId?: string | null
}

const isMember = (recipient: SegmentRecipient, identity: SegmentIdentity) =>
  Boolean(recipient.userId && identity.userIds.has(recipient.userId)) ||
  identity.emails.has(recipient.email.trim().toLowerCase())

export function applySegment<T extends SegmentRecipient>(
  recipients: readonly T[],
  segment: AudienceSegment,
  identity: SegmentIdentity,
): T[] {
  switch (segment) {
    case 'all':
      return [...recipients]
    case 'not_registered':
      return recipients.filter((recipient) => !isMember(recipient, identity))
    case 'registered':
    case 'volunteers':
      return recipients.filter((recipient) => isMember(recipient, identity))
  }
}
