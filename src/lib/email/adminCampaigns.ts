import { Resend } from 'resend'
import { supabaseAdmin } from '@/lib/supabase/server'

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

export interface CampaignSendFailure {
  email: string
  error: string
}

export interface CampaignSendReport {
  total: number
  sent: number
  failed: number
  failures: CampaignSendFailure[]
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

export async function buildUnifiedCampaignAudience() {
  const admin = supabaseAdmin()

  const entries: AudienceEntry[] = []
  const authEmailByUserId = new Map<string, { email: string; fullName?: string | null }>()

  let page = 1
  const perPage = 200

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
    if (error) throw error

    const users = data.users ?? []
    for (const user of users) {
      const email = user.email ? normalizeEmail(user.email) : ''
      const fullName =
        (user.user_metadata as Record<string, unknown> | undefined)?.full_name as
          | string
          | undefined

      if (email) {
        authEmailByUserId.set(user.id, { email, fullName: fullName ?? null })
      }

      entries.push({
        email,
        userId: user.id,
        fullName: fullName ?? null,
        source: 'auth',
      })
    }

    if (users.length < perPage) break
    page += 1
  }

  const { data: subscriptions, error: subscriptionsError } = await admin
    .from('list_subscriptions')
    .select('user_id, email, full_name, subscribed')
    .eq('subscribed', true)

  if (subscriptionsError) throw subscriptionsError

  for (const subscription of subscriptions ?? []) {
    const fallback = subscription.user_id ? authEmailByUserId.get(subscription.user_id) : null
    entries.push({
      email: subscription.email ?? fallback?.email ?? null,
      userId: subscription.user_id ?? undefined,
      fullName: subscription.full_name ?? fallback?.fullName ?? null,
      source: 'list_subscriptions',
    })
  }

  return mergeAudienceEntries(entries)
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

type BuildMessageResult = {
  from: string
  to: string
  subject: string
  html: string
  headers?: Record<string, string>
}

interface DispatchCampaignOptions {
  resend: Resend
  recipients: CampaignAudienceRecipient[]
  buildMessage: (recipient: CampaignAudienceRecipient) => Promise<BuildMessageResult>
  batchSize?: number
  retries?: number
}

export async function dispatchCampaign({
  resend,
  recipients,
  buildMessage,
  batchSize = 25,
  retries = 2,
}: DispatchCampaignOptions): Promise<CampaignSendReport> {
  const failures: CampaignSendFailure[] = []
  let sent = 0

  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize)
    await Promise.all(
      batch.map(async (recipient) => {
        for (let attempt = 0; attempt <= retries; attempt += 1) {
          try {
            const message = await buildMessage(recipient)
            const result = await resend.emails.send(message)
            if (result.error) {
              throw new Error(result.error.message || 'Erreur Resend')
            }
            sent += 1
            return
          } catch (error) {
            if (attempt < retries) {
              await sleep(300 * (attempt + 1))
              continue
            }
            failures.push({
              email: recipient.email,
              error: error instanceof Error ? error.message : 'Erreur inconnue',
            })
          }
        }
      }),
    )
  }

  return {
    total: recipients.length,
    sent,
    failed: failures.length,
    failures,
  }
}
