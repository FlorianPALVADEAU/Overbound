import { resolveAudience } from '@/lib/email/audience'

export type AudienceSource = 'auth' | 'list_subscriptions'

export interface AudienceEntry {
  email?: string | null
  userId?: string | null
  fullName?: string | null
  source: AudienceSource
}

export interface CampaignAudienceRecipient {
  email: string
  userId?: string
  fullName?: string | null
  sources: AudienceSource[]
}

export interface CampaignAudienceStats {
  totalUnique: number
  totalEntries: number
  duplicatesCollapsed: number
  invalidEmailSkipped: number
  sourceCounts: Record<AudienceSource, number>
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const normalizeEmail = (email: string) => email.trim().toLowerCase()

export function mergeAudienceEntries(entries: AudienceEntry[]): {
  recipients: CampaignAudienceRecipient[]
  stats: CampaignAudienceStats
} {
  const recipientsMap = new Map<string, CampaignAudienceRecipient>()
  let invalidEmailSkipped = 0
  const sourceCounts: Record<AudienceSource, number> = {
    auth: 0,
    list_subscriptions: 0,
  }

  for (const entry of entries) {
    const rawEmail = entry.email?.trim() ?? ''
    if (!rawEmail) {
      invalidEmailSkipped += 1
      continue
    }

    const email = normalizeEmail(rawEmail)
    if (!EMAIL_REGEX.test(email)) {
      invalidEmailSkipped += 1
      continue
    }

    sourceCounts[entry.source] += 1

    const existing = recipientsMap.get(email)
    if (existing) {
      if (!existing.sources.includes(entry.source)) {
        existing.sources.push(entry.source)
      }
      if (!existing.userId && entry.userId) {
        existing.userId = entry.userId
      }
      if (!existing.fullName && entry.fullName) {
        existing.fullName = entry.fullName
      }
      continue
    }

    recipientsMap.set(email, {
      email,
      userId: entry.userId ?? undefined,
      fullName: entry.fullName ?? null,
      sources: [entry.source],
    })
  }

  const recipients = Array.from(recipientsMap.values()).sort((a, b) =>
    a.email.localeCompare(b.email),
  )

  const stats: CampaignAudienceStats = {
    totalUnique: recipients.length,
    totalEntries: entries.length,
    duplicatesCollapsed: Math.max(entries.length - invalidEmailSkipped - recipients.length, 0),
    invalidEmailSkipped,
    sourceCounts,
  }

  return { recipients, stats }
}

/** Everyone subscribed to at least one active list, minus suppressed and digest-only addresses. */
export async function buildUnifiedCampaignAudience() {
  const audience = await resolveAudience()

  return mergeAudienceEntries(
    audience.map((recipient) => ({
      email: recipient.email,
      userId: recipient.userId,
      fullName: recipient.fullName,
      source: 'list_subscriptions' as const,
    })),
  )
}
