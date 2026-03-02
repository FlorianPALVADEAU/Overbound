import { Resend } from 'resend'
import type { NotificationPreferences } from '@/types/NotificationPreferences'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const RESEND_DEFAULT_AUDIENCE_ID =
  process.env.RESEND_SEGMENT_ID ||
  process.env.RESEND_DEFAULT_SEGMENT_ID ||
  process.env.RESEND_AUDIENCE_ID ||
  process.env.RESEND_DEFAULT_AUDIENCE_ID

export const DEFAULT_MARKETING_LIST_SLUGS = [
  'events-announcements',
  'price-alerts',
  'news-blog',
  'volunteers-opportunities',
  'partner-offers',
] as const

export type MarketingListSlug = (typeof DEFAULT_MARKETING_LIST_SLUGS)[number]
type MarketingPreferenceKey = keyof Pick<
  NotificationPreferences,
  | 'events_announcements'
  | 'price_alerts'
  | 'news_blog'
  | 'volunteers_opportunities'
  | 'partner_offers'
>

export type ResendContactInput = {
  email: string
  fullName?: string | null
  unsubscribed?: boolean
  audienceId: string // Can be a Resend segment id when using segment-based setup.
  properties?: Record<string, string | number | null>
}

const normalizeEmail = (email: string) => email.trim().toLowerCase()
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
const RESEND_MIN_INTERVAL_MS = 550
let lastResendCallAt = 0

async function throttleResend() {
  const now = Date.now()
  const elapsed = now - lastResendCallAt
  if (elapsed < RESEND_MIN_INTERVAL_MS) {
    await sleep(RESEND_MIN_INTERVAL_MS - elapsed)
  }
  lastResendCallAt = Date.now()
}

async function callResendWithRetry<T>(
  fn: () => Promise<{ data: T | null; error: { message: string; name: string } | null }>,
): Promise<{ data: T | null; error: { message: string; name: string } | null }> {
  const maxAttempts = 4
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    await throttleResend()
    const result = await fn()
    if (result.error?.name !== 'rate_limit_exceeded') {
      return result
    }

    if (attempt < maxAttempts) {
      await sleep(700 * attempt)
      continue
    }

    return result
  }

  return {
    data: null,
    error: {
      name: 'internal_server_error',
      message: 'Unreachable retry state',
    },
  }
}

const splitName = (fullName?: string | null) => {
  if (!fullName) return { firstName: undefined, lastName: undefined }

  const trimmed = fullName.trim()
  if (!trimmed) return { firstName: undefined, lastName: undefined }

  const [firstName, ...rest] = trimmed.split(/\s+/)
  return {
    firstName: firstName || undefined,
    lastName: rest.length > 0 ? rest.join(' ') : undefined,
  }
}

const getResend = () => {
  if (!RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not configured')
  }

  return new Resend(RESEND_API_KEY)
}

const slugToEnvKey = (slug: string) => `RESEND_AUDIENCE_${slug.toUpperCase().replace(/-/g, '_')}`
const TOPIC_ENV_BY_PREFERENCE: Record<MarketingPreferenceKey, string> = {
  events_announcements: 'RESEND_TOPIC_EVENTS_ANNOUNCEMENTS',
  price_alerts: 'RESEND_TOPIC_PRICE_ALERTS',
  news_blog: 'RESEND_TOPIC_NEWS_BLOG',
  volunteers_opportunities: 'RESEND_TOPIC_VOLUNTEERS_OPPORTUNITIES',
  partner_offers: 'RESEND_TOPIC_PARTNER_OFFERS',
}

export const getResendAudienceIdForSlug = (slug: string): string | null => {
  if (RESEND_DEFAULT_AUDIENCE_ID?.trim()) {
    return RESEND_DEFAULT_AUDIENCE_ID.trim()
  }

  const value = process.env[slugToEnvKey(slug)]
  if (!value) return null

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export const mapSlugsToAudienceIds = (slugs: string[]) => {
  if (RESEND_DEFAULT_AUDIENCE_ID?.trim()) {
    const audienceId = RESEND_DEFAULT_AUDIENCE_ID.trim()
    return {
      resolved: slugs.map((slug) => ({ slug, audienceId })),
      audienceIds: slugs.length > 0 ? [audienceId] : [],
      missingSlugs: [] as string[],
    }
  }

  const resolved = slugs.map((slug) => ({
    slug,
    audienceId: getResendAudienceIdForSlug(slug),
  }))

  return {
    resolved,
    audienceIds: resolved
      .map((entry) => entry.audienceId)
      .filter((id): id is string => Boolean(id)),
    missingSlugs: resolved
      .filter((entry) => !entry.audienceId)
      .map((entry) => entry.slug),
  }
}

export const mapPreferencesToResendTopics = (
  preferences: Partial<Record<MarketingPreferenceKey, boolean>>,
) => {
  const resolved = Object.entries(TOPIC_ENV_BY_PREFERENCE).map(([key, envKey]) => ({
    key: key as MarketingPreferenceKey,
    topicId: process.env[envKey]?.trim() || null,
    enabled: preferences[key as MarketingPreferenceKey],
  }))

  return {
    resolved: resolved.filter((row) => typeof row.enabled === 'boolean'),
    missingKeys: resolved
      .filter((row) => typeof row.enabled === 'boolean' && !row.topicId)
      .map((row) => row.key),
  }
}

export async function getResendTopicPreferences(email: string): Promise<Partial<Record<MarketingPreferenceKey, boolean>> | null> {
  const resend = getResend()
  const normalizedEmail = normalizeEmail(email)

  const contact = await callResendWithRetry(() =>
    resend.contacts.get({
      email: normalizedEmail,
    }),
  )

  if (contact.error?.name === 'not_found') {
    return null
  }

  if (contact.error) {
    throw new Error(`[resend] contact lookup failed: ${contact.error.name} ${contact.error.message}`)
  }

  const byTopicId = new Map<string, MarketingPreferenceKey>()
  const output: Partial<Record<MarketingPreferenceKey, boolean>> = {}

  for (const [key, envKey] of Object.entries(TOPIC_ENV_BY_PREFERENCE) as Array<[MarketingPreferenceKey, string]>) {
    const topicId = process.env[envKey]?.trim() || null
    if (!topicId) continue
    byTopicId.set(topicId, key)
    output[key] = false
  }

  if (byTopicId.size === 0) {
    return output
  }

  const topicsResult = await callResendWithRetry(() =>
    resend.contacts.topics.list({
      email: normalizedEmail,
      limit: 100,
    }),
  )

  const topics = unwrapData(topicsResult, 'list contact topics')
  for (const topic of topics.data) {
    const key = byTopicId.get(topic.id)
    if (!key) {
      continue
    }
    output[key] = topic.subscription === 'opt_in'
  }

  return output
}

const unwrapData = <T>(result: { data: T | null; error: { message: string; name: string } | null }, context: string) => {
  if (result.error) {
    throw new Error(`[resend] ${context}: ${result.error.name} ${result.error.message}`)
  }

  if (!result.data) {
    throw new Error(`[resend] ${context}: empty response`)
  }

  return result.data
}

const isMissingPropertyDefinitionError = (error: { message: string; name: string } | null) =>
  Boolean(
    error &&
      error.name === 'validation_error' &&
      /properties do not exist/i.test(error.message),
  )

export async function upsertResendContactInAudience(input: ResendContactInput) {
  const resend = getResend()
  const email = normalizeEmail(input.email)
  const { firstName, lastName } = splitName(input.fullName)

  const existing = await callResendWithRetry(() =>
    resend.contacts.get({
      email,
    }),
  )

  if (existing.error && existing.error.name !== 'not_found') {
    throw new Error(`[resend] contact lookup failed: ${existing.error.name} ${existing.error.message}`)
  }

  if (existing.data) {
    let updated = await callResendWithRetry(() =>
      resend.contacts.update({
        email,
        firstName: firstName ?? null,
        lastName: lastName ?? null,
        unsubscribed: input.unsubscribed,
        properties: input.properties,
      }),
    )
    if (isMissingPropertyDefinitionError(updated.error)) {
      updated = await callResendWithRetry(() =>
        resend.contacts.update({
          email,
          firstName: firstName ?? null,
          lastName: lastName ?? null,
          unsubscribed: input.unsubscribed,
        }),
      )
    }

    const updatedContact = unwrapData(updated, 'update contact')

    if (input.unsubscribed) {
      const removed = await callResendWithRetry(() =>
        resend.contacts.segments.remove({
          email,
          segmentId: input.audienceId,
        }),
      )
      if (removed.error && removed.error.name !== 'not_found') {
        throw new Error(
          `[resend] remove contact from segment: ${removed.error.name} ${removed.error.message}`,
        )
      }
    } else {
      const added = await callResendWithRetry(() =>
        resend.contacts.segments.add({
          email,
          segmentId: input.audienceId,
        }),
      )
      if (added.error) {
        throw new Error(
          `[resend] add contact to segment: ${added.error.name} ${added.error.message}`,
        )
      }
    }

    return updatedContact
  }

  let created = await callResendWithRetry(() =>
    resend.contacts.create({
      email,
      firstName,
      lastName,
      unsubscribed: input.unsubscribed,
      properties: input.properties,
    }),
  )
  if (isMissingPropertyDefinitionError(created.error)) {
    created = await callResendWithRetry(() =>
      resend.contacts.create({
        email,
        firstName,
        lastName,
        unsubscribed: input.unsubscribed,
      }),
    )
  }

  const createdContact = unwrapData(created, 'create contact')

  if (!input.unsubscribed) {
    const added = await callResendWithRetry(() =>
      resend.contacts.segments.add({
        email,
        segmentId: input.audienceId,
      }),
    )
    if (added.error) {
      throw new Error(`[resend] add contact to segment: ${added.error.name} ${added.error.message}`)
    }
  }

  return createdContact
}

export async function syncResendContactTopics(params: {
  email: string
  fullName?: string | null
  preferences: Partial<Record<MarketingPreferenceKey, boolean>>
}) {
  const resend = getResend()
  const email = normalizeEmail(params.email)
  const { firstName, lastName } = splitName(params.fullName)

  const existing = await callResendWithRetry(() =>
    resend.contacts.get({
      email,
    }),
  )

  if (existing.error?.name === 'not_found') {
    await callResendWithRetry(() =>
      resend.contacts.create({
        email,
        firstName,
        lastName,
      }),
    )
  } else if (existing.error) {
    throw new Error(`[resend] contact lookup failed: ${existing.error.name} ${existing.error.message}`)
  } else if (existing.data) {
    await callResendWithRetry(() =>
      resend.contacts.update({
        email,
        firstName: firstName ?? null,
        lastName: lastName ?? null,
      }),
    )
  }

  const { resolved, missingKeys } = mapPreferencesToResendTopics(params.preferences)
  if (missingKeys.length > 0) {
    console.warn('[resend] missing topic mapping for preferences', missingKeys)
  }

  const topics = resolved
    .filter((row) => row.topicId)
    .map((row) => ({
      id: row.topicId as string,
      subscription: row.enabled ? ('opt_in' as const) : ('opt_out' as const),
    }))

  if (topics.length === 0) {
    return
  }

  const updated = await callResendWithRetry(() =>
    resend.contacts.topics.update({
      email,
      topics,
    }),
  )

  unwrapData(updated, 'update contact topics')
}

export async function subscribeResendContactToAudiences(params: {
  email: string
  fullName?: string | null
  audienceIds: string[]
  properties?: Record<string, string | number | null>
}) {
  for (const audienceId of params.audienceIds) {
    await upsertResendContactInAudience({
      email: params.email,
      fullName: params.fullName,
      audienceId,
      unsubscribed: false,
      properties: params.properties,
    })
  }
}

export async function unsubscribeResendContactFromAudiences(params: {
  email: string
  audienceIds: string[]
}) {
  for (const audienceId of params.audienceIds) {
    const resend = getResend()
    const existing = await callResendWithRetry(() =>
      resend.contacts.get({
        email: normalizeEmail(params.email),
      }),
    )

    if (existing.error?.name === 'not_found') {
      continue
    }

    if (existing.error) {
      throw new Error(`[resend] contact lookup failed: ${existing.error.name} ${existing.error.message}`)
    }

    const updated = await callResendWithRetry(() =>
      resend.contacts.update({
        email: normalizeEmail(params.email),
        unsubscribed: true,
      }),
    )

    unwrapData(updated, 'unsubscribe contact')

    const removed = await callResendWithRetry(() =>
      resend.contacts.segments.remove({
        email: normalizeEmail(params.email),
        segmentId: audienceId,
      }),
    )
    if (removed.error && removed.error.name !== 'not_found') {
      throw new Error(
        `[resend] remove contact from segment: ${removed.error.name} ${removed.error.message}`,
      )
    }
  }
}

export async function listResendAudienceContacts(audienceId: string) {
  const resend = getResend()
  const contacts: Array<{
    id: string
    email: string
    first_name: string | null
    last_name: string | null
    unsubscribed: boolean
    created_at: string
  }> = []

  let after: string | undefined

  while (true) {
    const response = await callResendWithRetry(() =>
      resend.contacts.list({
        segmentId: audienceId,
        limit: 100,
        after,
      }),
    )

    const payload = unwrapData(response, 'list contacts')
    contacts.push(...payload.data)

    if (!payload.has_more || payload.data.length === 0) {
      break
    }

    after = payload.data[payload.data.length - 1]?.id
    if (!after) {
      break
    }
  }

  return contacts
}

export async function isResendContactSubscribed(params: { email: string; audienceId: string }) {
  const resend = getResend()
  const result = await callResendWithRetry(() =>
    resend.contacts.get({
      email: normalizeEmail(params.email),
    }),
  )

  if (result.error?.name === 'not_found') {
    return false
  }

  const contact = unwrapData(result, 'get contact')
  if (contact.unsubscribed) {
    return false
  }

  const segments = await callResendWithRetry(() =>
    resend.contacts.segments.list({
      email: normalizeEmail(params.email),
      limit: 100,
    }),
  )

  const payload = unwrapData(segments, 'list contact segments')
  return payload.data.some((segment) => segment.id === params.audienceId)
}

export async function deleteResendContactByEmail(email: string) {
  const resend = getResend()
  const normalizedEmail = normalizeEmail(email)

  const removed = await callResendWithRetry(() =>
    resend.contacts.remove({
      email: normalizedEmail,
    }),
  )

  if (removed.error?.name === 'not_found') {
    return { deleted: false }
  }

  const data = unwrapData(removed, 'delete contact')
  return { deleted: data.deleted }
}
